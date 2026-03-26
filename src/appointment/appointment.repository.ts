import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AppointmentSelectResult = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasOverlappingScheduledAppointment(
    userId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean> {
    const existing = await this.prisma.appointment.findFirst({
      where: {
        userId,
        deletedAt: null,
        status: AppointmentStatus.SCHEDULED,
        // (startA < endB) AND (endA > startB)
        // => existing.startsAt < endsAt AND existing.endsAt > startsAt
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });

    return !!existing;
  }

  async hasOverlappingScheduledAppointmentExcludingId(input: {
    userId: string;
    startsAt: Date;
    endsAt: Date;
    excludeId: string;
  }): Promise<boolean> {
    const existing = await this.prisma.appointment.findFirst({
      where: {
        userId: input.userId,
        deletedAt: null,
        status: AppointmentStatus.SCHEDULED,
        id: { not: input.excludeId },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      select: { id: true },
    });

    return !!existing;
  }

  async createAppointment(input: {
    userId: string;
    title: string;
    description?: string;
    startsAt: Date;
    endsAt: Date;
    isAllDay: boolean;
  }): Promise<AppointmentSelectResult> {
    const created = await this.prisma.appointment.create({
      data: {
        userId: input.userId,
        title: input.title,
        ...(input.description !== undefined ? { description: input.description } : {}),
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: AppointmentStatus.SCHEDULED,
        isAllDay: input.isAllDay,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return created;
  }

  async updateAppointmentByIdForUser(input: {
    userId: string;
    id: string;
    data: {
      title?: string;
      description?: string | null;
      startsAt?: Date;
      endsAt?: Date;
      isAllDay?: boolean;
    };
  }): Promise<AppointmentSelectResult | null> {
    const updated = await this.prisma.appointment.updateMany({
      where: {
        id: input.id,
        userId: input.userId,
        deletedAt: null,
      },
      data: input.data,
    });

    if (updated.count === 0) {
      return null;
    }

    return this.findAppointmentByIdForUser({ userId: input.userId, id: input.id });
  }

  async softDeleteAppointmentByIdForUser(input: {
    userId: string;
    id: string;
  }): Promise<number> {
    const res = await this.prisma.appointment.updateMany({
      where: {
        id: input.id,
        userId: input.userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return res.count;
  }

  async findAppointmentsForUser(input: {
    userId: string;
    skip: number;
    take: number;
  }): Promise<AppointmentSelectResult[]> {
    return this.prisma.appointment.findMany({
      where: {
        userId: input.userId,
        deletedAt: null,
      },
      orderBy: {
        startsAt: 'asc',
      },
      skip: input.skip,
      take: input.take,
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async countAppointmentsForUser(userId: string): Promise<number> {
    return this.prisma.appointment.count({
      where: { userId, deletedAt: null },
    });
  }

  async findAppointmentByIdForUser(input: {
    userId: string;
    id: string;
  }): Promise<AppointmentSelectResult | null> {
    return this.prisma.appointment.findFirst({
      where: {
        id: input.id,
        userId: input.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

