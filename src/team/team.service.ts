import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TeamRole,
  InvitationStatus,
  NotificationType,
  NotificationEventType,
} from '@prisma/client';
import { ChangeMemberRoleRequestDto } from './dto/change-member-role-request.dto';
import { CreateTeamInvitationRequestDto } from './dto/create-team-invitation-request.dto';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { GetTeamsQueryDto } from './dto/get-teams-query.dto';
import { InvitationActionResponseDto } from './dto/invitation-action-response.dto';
import { LeaveTeamResponseDto } from './dto/leave-team-response.dto';
import { TeamDetailResponseDto } from './dto/team-detail-response.dto';
import { TeamInvitationResponseDto } from './dto/team-invitation-response.dto';
import { TeamListResponseDto } from './dto/team-list-response.dto';
import { TeamMemberListResponseDto } from './dto/team-member-list-response.dto';
import { TeamMemberRoleResponseDto } from './dto/team-member-role-response.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamRepository } from './team.repository';
import { NotificationService } from '../notification/notification.service';
import { GetMyInvitationsQueryDto } from './dto/get-my-invitations-query.dto';
import { TeamMyInvitationItemDto } from './dto/team-my-invitation-response.dto';

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

  async getMyInvitations(
    userId: string,
    query?: GetMyInvitationsQueryDto,
  ): Promise<TeamMyInvitationItemDto[]> {
    const invitations =
      await this.teamRepository.findInvitationsByInvitee(userId);

    const items = invitations.map((invitation) => ({
      invitationId: invitation.id,
      teamId: invitation.teamId,
      teamName: invitation.team.name,
      role: invitation.role,
      status: this.resolveInvitationStatus(invitation),
      invitedAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    }));

    if (!query?.status) {
      return items;
    }

    return items.filter((item) => item.status === query.status);
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

    const roleToAssign = dto.role ?? TeamRole.MEMBER;
    if (roleToAssign === TeamRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign OWNER role through invitation',
      );
    }

    try {
      const invitation = await this.teamRepository.createInvitation({
        teamId,
        invitedUserId: dto.invitedUserId,
        invitedById: userId,
        role: roleToAssign,
        expiresAt: dto.expiresAt,
      });

      // Send notification to invited user
      await this.notificationService.sendAndCreateNotification({
        userId: dto.invitedUserId,
        actorUserId: userId,
        type: NotificationType.TEAM_INVITATION,
        eventType: NotificationEventType.TEAM_INVITE_CREATED,
        teamInvitationId: invitation.id,
        title: 'Team Invitation',
        body: `You have been invited to team ${team.name}`,
        payload: { teamId: team.id },
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

  async acceptInvitation(
    userId: string,
    teamId: string,
    invitationId: string,
  ): Promise<InvitationActionResponseDto> {
    const invitation = await this.teamRepository.findPendingInvitation({
      teamId,
      invitationId,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.teamId !== teamId) {
      throw new BadRequestException('Invitation does not belong to this team');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        'Invitation is not in PENDING state. Cannot accept.',
      );
    }

    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException('Only invited user can accept invitation');
    }

    if (invitation.expiresAt && invitation.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('Invitation has expired');
    }

    const isAlreadyMember = await this.teamRepository.isActiveMember({
      teamId,
      userId,
    });
    if (isAlreadyMember) {
      throw new ConflictException('User is already an active team member');
    }

    try {
      await this.teamRepository.createTeamMemberFromInvitation({
        teamId,
        userId,
        role: invitation.role,
      });

      await this.teamRepository.updateInvitationStatus({
        invitationId,
        status: InvitationStatus.ACCEPTED,
      });

      return {
        message: 'Invitation accepted successfully',
        data: null,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User is already an active team member');
      }
      throw error;
    }
  }

  async declineInvitation(
    userId: string,
    teamId: string,
    invitationId: string,
  ): Promise<InvitationActionResponseDto> {
    const invitation = await this.teamRepository.findPendingInvitation({
      teamId,
      invitationId,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.teamId !== teamId) {
      throw new BadRequestException('Invitation does not belong to this team');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException(
        'Invitation is not in PENDING state. Cannot decline.',
      );
    }

    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException('Only invited user can decline invitation');
    }

    await this.teamRepository.updateInvitationStatus({
      invitationId,
      status: InvitationStatus.DECLINED,
    });

    return {
      message: 'Invitation declined successfully',
      data: null,
    };
  }

  async changeMemberRole(
    userId: string,
    teamId: string,
    targetUserId: string,
    dto: ChangeMemberRoleRequestDto,
  ): Promise<TeamMemberRoleResponseDto> {
    if (dto.role === TeamRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign OWNER role through this API',
      );
    }

    const team = await this.teamRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const callerRole = await this.getActiveRole(teamId, userId, team.ownerId);
    if (
      !callerRole ||
      (callerRole !== TeamRole.OWNER && callerRole !== TeamRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'Only team owner or admin can change member role',
      );
    }

    const targetMembership = await this.teamRepository.findMembershipWithRole({
      teamId,
      userId: targetUserId,
    });

    if (!targetMembership) {
      throw new NotFoundException(
        `Member with id ${targetUserId} not found in team`,
      );
    }

    if (targetMembership.role === TeamRole.OWNER) {
      throw new ConflictException('Cannot modify Team Owner role');
    }

    // Business Rule BR-63: Admin cannot change another Admin
    if (
      callerRole === TeamRole.ADMIN &&
      targetMembership.role === TeamRole.ADMIN
    ) {
      throw new ForbiddenException('Admin cannot modify another admin');
    }

    if (targetMembership.role === dto.role) {
      throw new ConflictException('Member already has this role');
    }

    const updated = await this.teamRepository.updateMemberRole({
      teamId,
      userId: targetUserId,
      role: dto.role,
    });

    return {
      teamId: updated.teamId,
      userId: updated.userId,
      role: updated.role,
      updatedById: userId,
      updatedAt: updated.updatedAt,
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

  private resolveInvitationStatus(input: {
    status: InvitationStatus;
    expiresAt: Date | null;
  }): InvitationStatus {
    if (
      input.status === InvitationStatus.PENDING &&
      input.expiresAt &&
      input.expiresAt.getTime() <= Date.now()
    ) {
      return InvitationStatus.EXPIRED;
    }

    return input.status;
  }
}
