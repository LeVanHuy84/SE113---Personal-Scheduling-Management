import { Injectable } from '@nestjs/common';
import {
  InvitationStatus,
  MembershipStatus,
  Prisma,
  TeamRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamDetailResponseDto } from './dto/team-detail-response.dto';
import { TeamInvitationResponseDto } from './dto/team-invitation-response.dto';
import {
  TeamListItemDto,
  TeamListResponseDto,
} from './dto/team-list-response.dto';
import { TeamMemberItemDto } from './dto/team-member-list-response.dto';
import { TeamResponseDto } from './dto/team-response.dto';

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsByOwnerAndName(input: {
    ownerId: string;
    name: string;
  }): Promise<boolean> {
    const count = await this.prisma.team.count({
      where: {
        ownerId: input.ownerId,
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
      },
    });

    return count > 0;
  }

  async createTeamWithOwner(input: {
    ownerId: string;
    name: string;
    description: string | null;
  }): Promise<TeamResponseDto> {
    const createdTeam = await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          ownerId: input.ownerId,
          name: input.name,
          description: input.description,
          status: MembershipStatus.ACTIVE,
        },
        select: {
          id: true,
          ownerId: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: input.ownerId,
          role: TeamRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return team;
    });

    return {
      id: createdTeam.id,
      ownerId: createdTeam.ownerId,
      name: createdTeam.name,
      description: createdTeam.description,
      createdAt: createdTeam.createdAt,
      updatedAt: createdTeam.updatedAt,
    };
  }

  async findVisibleTeams(input: {
    userId: string;
    page: number;
    limit: number;
    searchText?: string;
  }): Promise<TeamListResponseDto> {
    const { userId, page, limit, searchText } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.TeamWhereInput = {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              status: MembershipStatus.ACTIVE,
            },
          },
        },
      ],
    };

    if (searchText) {
      where.name = {
        contains: searchText,
        mode: 'insensitive',
      };
    }

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          ownerId: true,
          name: true,
          members: {
            where: {
              userId,
              status: MembershipStatus.ACTIVE,
            },
            select: {
              role: true,
            },
            take: 1,
          },
          _count: {
            select: {
              members: {
                where: {
                  status: MembershipStatus.ACTIVE,
                },
              },
            },
          },
        },
      }),
      this.prisma.team.count({ where }),
    ]);

    const items: TeamListItemDto[] = teams.map((team) => ({
      id: team.id,
      name: team.name,
      role:
        team.ownerId === userId
          ? TeamRole.OWNER
          : (team.members[0]?.role ?? TeamRole.MEMBER),
      memberCount: team._count.members,
    }));

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async findTeamById(teamId: string): Promise<{
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return this.prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findActiveMembership(input: {
    teamId: string;
    userId: string;
  }): Promise<{ role: TeamRole; status: MembershipStatus } | null> {
    return this.prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: input.userId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        role: true,
        status: true,
      },
    });
  }

  async findTeamDetail(input: {
    teamId: string;
    userId: string;
  }): Promise<TeamDetailResponseDto | null> {
    const team = await this.prisma.team.findUnique({
      where: {
        id: input.teamId,
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            userId: input.userId,
            status: MembershipStatus.ACTIVE,
          },
          select: {
            role: true,
          },
          take: 1,
        },
        _count: {
          select: {
            members: {
              where: {
                status: MembershipStatus.ACTIVE,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    const myRole =
      team.ownerId === input.userId
        ? TeamRole.OWNER
        : (team.members[0]?.role ?? null);

    if (!myRole) {
      return null;
    }

    return {
      id: team.id,
      ownerId: team.ownerId,
      name: team.name,
      description: team.description,
      myRole,
      memberCount: team._count.members,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  async findActiveMembersByTeamId(
    teamId: string,
  ): Promise<TeamMemberItemDto[]> {
    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        status: MembershipStatus.ACTIVE,
      },
      orderBy: {
        joinedAt: 'asc',
      },
      select: {
        userId: true,
        role: true,
        status: true,
        joinedAt: true,
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });

    return members.map((member) => ({
      userId: member.userId,
      displayName: member.user.displayName,
      email: member.user.email,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
    }));
  }

  async userExists(userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: userId },
    });
    return count > 0;
  }

  async isActiveMember(input: {
    teamId: string;
    userId: string;
  }): Promise<boolean> {
    const count = await this.prisma.teamMember.count({
      where: {
        teamId: input.teamId,
        userId: input.userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    return count > 0;
  }

  async hasPendingInvitation(input: {
    teamId: string;
    invitedUserId: string;
  }): Promise<boolean> {
    const count = await this.prisma.teamInvitation.count({
      where: {
        teamId: input.teamId,
        invitedUserId: input.invitedUserId,
        status: InvitationStatus.PENDING,
      },
    });

    return count > 0;
  }

  async createInvitation(input: {
    teamId: string;
    invitedUserId: string;
    invitedById: string;
    role: TeamRole;
    expiresAt?: Date;
  }): Promise<TeamInvitationResponseDto> {
    const created = await this.prisma.teamInvitation.create({
      data: {
        teamId: input.teamId,
        invitedUserId: input.invitedUserId,
        invitedById: input.invitedById,
        role: input.role,
        status: InvitationStatus.PENDING,
        expiresAt: input.expiresAt,
      },
      select: {
        id: true,
        teamId: true,
        invitedUserId: true,
        invitedById: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return {
      id: created.id,
      teamId: created.teamId,
      invitedUserId: created.invitedUserId,
      invitedById: created.invitedById,
      role: created.role,
      status: created.status,
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
    };
  }

  async findInvitationsByInvitee(userId: string): Promise<
    Array<{
      id: string;
      teamId: string;
      role: TeamRole;
      status: InvitationStatus;
      createdAt: Date;
      expiresAt: Date | null;
      team: {
        name: string;
      };
    }>
  > {
    return this.prisma.teamInvitation.findMany({
      where: {
        invitedUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        teamId: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async countActiveOwners(teamId: string): Promise<number> {
    return this.prisma.teamMember.count({
      where: {
        teamId,
        role: TeamRole.OWNER,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async markMembershipInactive(input: {
    teamId: string;
    userId: string;
  }): Promise<void> {
    await this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId: input.teamId,
          userId: input.userId,
        },
      },
      data: {
        status: MembershipStatus.INACTIVE,
      },
    });
  }

  async findPendingInvitation(input: {
    teamId: string;
    invitationId: string;
  }): Promise<{
    id: string;
    teamId: string;
    invitedUserId: string;
    role: TeamRole;
    status: any;
    expiresAt: Date | null;
  } | null> {
    return this.prisma.teamInvitation.findUnique({
      where: { id: input.invitationId },
      select: {
        id: true,
        teamId: true,
        invitedUserId: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });
  }

  async updateInvitationStatus(input: {
    invitationId: string;
    status: any;
  }): Promise<void> {
    await this.prisma.teamInvitation.update({
      where: { id: input.invitationId },
      data: {
        status: input.status,
        respondedAt: new Date(),
      },
    });
  }

  async createTeamMemberFromInvitation(input: {
    teamId: string;
    userId: string;
    role: TeamRole;
  }): Promise<void> {
    await this.prisma.teamMember.create({
      data: {
        teamId: input.teamId,
        userId: input.userId,
        role: input.role,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async updateMemberRole(input: {
    teamId: string;
    userId: string;
    role: TeamRole;
  }): Promise<{
    teamId: string;
    userId: string;
    role: TeamRole;
    updatedAt: Date;
  }> {
    const updated = await this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId: input.teamId,
          userId: input.userId,
        },
      },
      data: {
        role: input.role,
        updatedAt: new Date(),
      },
      select: {
        teamId: true,
        userId: true,
        role: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async findMembershipWithRole(input: {
    teamId: string;
    userId: string;
  }): Promise<{
    teamId: string;
    userId: string;
    role: TeamRole;
    status: MembershipStatus;
  } | null> {
    return this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: input.teamId,
          userId: input.userId,
        },
      },
      select: {
        teamId: true,
        userId: true,
        role: true,
        status: true,
      },
    });
  }
}
