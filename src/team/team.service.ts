import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TeamRole } from '@prisma/client';
import { CreateTeamInvitationRequestDto } from './dto/create-team-invitation-request.dto';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { GetTeamsQueryDto } from './dto/get-teams-query.dto';
import { LeaveTeamResponseDto } from './dto/leave-team-response.dto';
import { TeamDetailResponseDto } from './dto/team-detail-response.dto';
import { TeamInvitationResponseDto } from './dto/team-invitation-response.dto';
import { TeamListResponseDto } from './dto/team-list-response.dto';
import { TeamMemberListResponseDto } from './dto/team-member-list-response.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamRepository } from './team.repository';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TeamService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async createTeam(
    userId: string,
    dto: CreateTeamRequestDto,
  ): Promise<TeamResponseDto> {
    const normalizedName = dto.name.trim();
    const isDuplicate = await this.teamRepository.existsByOwnerAndName({
      ownerId: userId,
      name: normalizedName,
    });

    if (isDuplicate) {
      throw new ConflictException('Team name already exists in owner scope');
    }

    try {
      return await this.teamRepository.createTeamWithOwner({
        ownerId: userId,
        name: normalizedName,
        description: dto.description ?? null,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Team name already exists in owner scope');
      }
      throw error;
    }
  }

  async getMyTeams(
    userId: string,
    query: GetTeamsQueryDto,
  ): Promise<TeamListResponseDto> {
    return this.teamRepository.findVisibleTeams({
      userId,
      page: query.page,
      limit: query.limit,
      searchText: query.searchText,
    });
  }

  async getTeamDetail(
    userId: string,
    teamId: string,
  ): Promise<TeamDetailResponseDto> {
    const team = await this.teamRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const detail = await this.teamRepository.findTeamDetail({ teamId, userId });
    if (!detail) {
      throw new ForbiddenException('You are not an active member of this team');
    }

    return detail;
  }

  async getMembers(
    userId: string,
    teamId: string,
  ): Promise<TeamMemberListResponseDto> {
    await this.assertCanViewTeam(userId, teamId);

    const items = await this.teamRepository.findActiveMembersByTeamId(teamId);
    return { items };
  }

  async inviteMember(
    userId: string,
    teamId: string,
    dto: CreateTeamInvitationRequestDto,
  ): Promise<TeamInvitationResponseDto> {
    const team = await this.teamRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const inviterRole = await this.getActiveRole(teamId, userId, team.ownerId);
    if (
      !inviterRole ||
      (inviterRole !== TeamRole.OWNER && inviterRole !== TeamRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'Only team owner or admin can invite members',
      );
    }

    const invitedUserExists = await this.teamRepository.userExists(
      dto.invitedUserId,
    );
    if (!invitedUserExists) {
      throw new NotFoundException(
        `Invited user with id ${dto.invitedUserId} not found`,
      );
    }

    if (dto.expiresAt && dto.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    const isAlreadyMember = await this.teamRepository.isActiveMember({
      teamId,
      userId: dto.invitedUserId,
    });
    if (isAlreadyMember) {
      throw new ConflictException('User is already an active team member');
    }

    const hasPendingInvitation = await this.teamRepository.hasPendingInvitation(
      {
        teamId,
        invitedUserId: dto.invitedUserId,
      },
    );
    if (hasPendingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this user',
      );
    }

    try {
      const invitation = await this.teamRepository.createInvitation({
        teamId,
        invitedUserId: dto.invitedUserId,
        invitedById: userId,
        role: dto.role ?? TeamRole.MEMBER,
        expiresAt: dto.expiresAt,
      });

      // Send notification to invited user
      await this.notificationService.sendAndCreateNotification({
        appointment: {
          id: team.id,
          userId: dto.invitedUserId,
          startAt: new Date(),
        },
        title: 'Team Invitation',
        body: `You have been invited to team ${team.name}`,
        type: 'SYSTEM',
        data: {
          teamId: team.id,
        },
      });

      return invitation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A pending invitation already exists for this user',
        );
      }
      throw error;
    }
  }

  async leaveTeam(
    userId: string,
    teamId: string,
  ): Promise<LeaveTeamResponseDto> {
    const team = await this.teamRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const membership = await this.teamRepository.findActiveMembership({
      teamId,
      userId,
    });
    if (!membership) {
      throw new NotFoundException('Active membership not found');
    }

    if (membership.role === TeamRole.OWNER) {
      const activeOwnerCount =
        await this.teamRepository.countActiveOwners(teamId);
      if (activeOwnerCount <= 1) {
        throw new ConflictException(
          'Cannot leave team as the last active owner',
        );
      }

      throw new ForbiddenException(
        'Owner must transfer ownership before leaving the team',
      );
    }

    await this.teamRepository.markMembershipInactive({ teamId, userId });

    return {
      message: 'Left team successfully',
      data: null,
    };
  }

  private async assertCanViewTeam(
    userId: string,
    teamId: string,
  ): Promise<void> {
    const team = await this.teamRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const myRole = await this.getActiveRole(teamId, userId, team.ownerId);
    if (!myRole) {
      throw new ForbiddenException('You are not an active member of this team');
    }
  }

  private async getActiveRole(
    teamId: string,
    userId: string,
    ownerId: string,
  ): Promise<TeamRole | null> {
    if (ownerId === userId) {
      return TeamRole.OWNER;
    }

    const membership = await this.teamRepository.findActiveMembership({
      teamId,
      userId,
    });
    return membership?.role ?? null;
  }
}
