import { Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  MembershipStatus,
  ParticipationType,
  Prisma,
  TeamRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type TeamAppointmentRecord = {
  id: string;
  teamId: string;
  organizerId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  participants: Array<{ userId: string; participationType: ParticipationType }>;
  createdAt: Date;
  updatedAt: Date;
};

type TeamMemberProfileRecord = {
  userId: string;
  displayName: string;
};

@Injectable()
export class TeamAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTeamById(
    teamId: string,
  ): Promise<{ id: string; ownerId: string } | null> {
    return this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });
  }

  async findActiveMembership(input: {
    teamId: string;
    userId: string;
  }): Promise<{ role: TeamRole } | null> {
    return this.prisma.teamMember.findFirst({
      where: {
        teamId: input.teamId,
        userId: input.userId,
        status: MembershipStatus.ACTIVE,
      },
      select: { role: true },
    });
  }

  async findActiveMembersByIds(input: {
    teamId: string;
    userIds: string[];
  }): Promise<string[]> {
    if (!input.userIds.length) {
      return [];
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId: input.teamId,
        status: MembershipStatus.ACTIVE,
        userId: { in: input.userIds },
      },
      select: { userId: true },
    });

    return members.map((member) => member.userId);
  }

  async findActiveMemberProfilesByTeamId(
    teamId: string,
  ): Promise<TeamMemberProfileRecord[]> {
    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        userId: true,
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
      displayName: member.user.displayName ?? member.user.email,
    }));
  }

  async findActiveMemberProfilesByIds(input: {
    teamId: string;
    userIds: string[];
  }): Promise<TeamMemberProfileRecord[]> {
    if (!input.userIds.length) {
      return [];
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId: input.teamId,
        status: MembershipStatus.ACTIVE,
        userId: { in: input.userIds },
      },
      select: {
        userId: true,
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
      displayName: member.user.displayName ?? member.user.email,
    }));
  }

  async createTeamAppointment(input: {
    teamId: string;
    organizerId: string;
    title: string;
    description: string | null;
    location: string | null;
    startAt: Date;
    endAt: Date;
    participantUserIds: string[];
  }): Promise<TeamAppointmentRecord> {
    return this.prisma.teamAppointment.create({
      data: {
        teamId: input.teamId,
        organizerId: input.organizerId,
        title: input.title,
        description: input.description,
        location: input.location,
        startAt: input.startAt,
        endAt: input.endAt,
        status: AppointmentStatus.SCHEDULED,
        participants: {
          create: input.participantUserIds.map((userId) => ({
            userId,
            participationType: ParticipationType.REQUIRED,
          })),
        },
      },
      select: {
        id: true,
        teamId: true,
        organizerId: true,
        title: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          select: {
            userId: true,
            participationType: true,
          },
          orderBy: { userId: 'asc' },
        },
      },
    });
  }

  async findTeamAppointmentById(input: {
    teamId: string;
    appointmentId: string;
  }): Promise<TeamAppointmentRecord | null> {
    return this.prisma.teamAppointment.findFirst({
      where: {
        id: input.appointmentId,
        teamId: input.teamId,
      },
      select: {
        id: true,
        teamId: true,
        organizerId: true,
        title: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          select: {
            userId: true,
            participationType: true,
          },
          orderBy: { userId: 'asc' },
        },
      },
    });
  }

  async updateTeamAppointment(input: {
    appointmentId: string;
    title: string;
    description: string | null;
    location: string | null;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    participantUserIds: string[];
  }): Promise<TeamAppointmentRecord> {
    return this.prisma.$transaction(async (tx) => {
      await tx.teamAppointment.update({
        where: { id: input.appointmentId },
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          startAt: input.startAt,
          endAt: input.endAt,
          status: input.status,
        },
      });

      await tx.appointmentParticipant.deleteMany({
        where: { teamAppointmentId: input.appointmentId },
      });

      await tx.appointmentParticipant.createMany({
        data: input.participantUserIds.map((userId) => ({
          teamAppointmentId: input.appointmentId,
          userId,
          participationType: ParticipationType.REQUIRED,
        })),
      });

      const updated = await tx.teamAppointment.findUnique({
        where: { id: input.appointmentId },
        select: {
          id: true,
          teamId: true,
          organizerId: true,
          title: true,
          description: true,
          location: true,
          startAt: true,
          endAt: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          participants: {
            select: {
              userId: true,
              participationType: true,
            },
            orderBy: { userId: 'asc' },
          },
        },
      });

      if (!updated) {
        throw new Error('Failed to load updated team appointment');
      }

      return updated;
    });
  }

  async deleteTeamAppointment(appointmentId: string): Promise<void> {
    await this.prisma.teamAppointment.delete({ where: { id: appointmentId } });
  }

  async findTeamAppointments(input: {
    teamId: string;
    from: Date;
    to: Date;
    page: number;
    limit: number;
  }): Promise<{
    items: Array<{
      id: string;
      teamId: string;
      organizerId: string;
      title: string;
      startAt: Date;
      endAt: Date;
      status: AppointmentStatus;
      participantCount: number;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (input.page - 1) * input.limit;

    const where: Prisma.TeamAppointmentWhereInput = {
      teamId: input.teamId,
        startAt: { lt: input.to },
        endAt: { gt: input.from },
    };

    const [rows, total] = await Promise.all([
      this.prisma.teamAppointment.findMany({
        where,
        orderBy: { startAt: 'asc' },
        skip,
        take: input.limit,
        select: {
          id: true,
          teamId: true,
          organizerId: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
          _count: {
            select: {
              participants: true,
            },
          },
        },
      }),
      this.prisma.teamAppointment.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        teamId: row.teamId,
        organizerId: row.organizerId,
        title: row.title,
        startAt: row.startAt,
        endAt: row.endAt,
        status: row.status,
        participantCount: row._count.participants,
      })),
      total,
      page: input.page,
      limit: input.limit,
    };
  }

  async findCalendarAppointments(input: {
    userId: string;
    from: Date;
    to: Date;
    teamIds?: string[];
  }): Promise<
    Array<{
      id: string;
      teamId: string;
      title: string;
      startAt: Date;
      endAt: Date;
    }>
  > {
    const where: Prisma.TeamAppointmentWhereInput = {
      startAt: { lt: input.to },
      endAt: { gt: input.from },
      OR: [
        { organizerId: input.userId },
        {
          participants: {
            some: {
              userId: input.userId,
            },
          },
        },
        {
          team: {
            members: {
              some: {
                userId: input.userId,
                status: MembershipStatus.ACTIVE,
              },
            },
          },
        },
      ],
    };

    if (input.teamIds?.length) {
      where.teamId = {
        in: input.teamIds,
      };
    }

    return this.prisma.teamAppointment.findMany({
      where,
      orderBy: {
        startAt: 'asc',
      },
      select: {
        id: true,
        teamId: true,
        title: true,
        startAt: true,
        endAt: true,
      },
    });
  }

  async findPersonalConflicts(input: {
    userId: string;
    startAt: Date;
    endAt: Date;
  }): Promise<Array<{ startAt: Date; endAt: Date }>> {
    return this.prisma.appointment.findMany({
      where: {
        userId: input.userId,
        status: AppointmentStatus.SCHEDULED,
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
      },
      select: {
        startAt: true,
        endAt: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async findTeamAppointmentConflicts(input: {
    userId: string;
    startAt: Date;
    endAt: Date;
    excludeAppointmentId?: string;
  }): Promise<Array<{ startAt: Date; endAt: Date }>> {
    return this.prisma.teamAppointment.findMany({
      where: {
        id: input.excludeAppointmentId
          ? {
              not: input.excludeAppointmentId,
            }
          : undefined,
        status: AppointmentStatus.SCHEDULED,
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
        participants: {
          some: {
            userId: input.userId,
            participationType: ParticipationType.REQUIRED,
          },
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }
}
