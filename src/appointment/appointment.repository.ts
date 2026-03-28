import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma, RecurrenceType, Weekday } from '@prisma/client';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { TagResponseDto } from 'src/tag/dto/tag-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentSeriesResponseDto } from './dto/appointment-response.dto';
import { AppointmentSeriesQueryDto } from './dto/get-appointments-query.dto';
import { UpdateAppointmentSeriesRequestDto } from './dto/update-appointment-request.dto';


@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) { }

  toDto(entity) {
    return {
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      startAt: entity.startAt,
      endAt: entity.endAt,
      description: entity.description,
      recurrenceType: entity.recurrenceType,
      weeklyDay: entity.weeklyDay.map(d => d.toString()), // convert enum/string nếu cần
      monthlyDay: entity.monthlyDay,
      yearlyDay: entity.yearlyDay,
      yearlyMonth: entity.yearlyMonth,
      seriesTimezone: entity.seriesTimezone,
      cancelledAt: entity.cancelledAt,
      tags: (entity.tags ?? []).map(t => ({
        id: t.tag.id,
        name: t.tag.name,
        color: t.tag.color,
      })) as TagResponseDto[],
    }
  }

  async hasOverlappingScheduledAppointment(
    userId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean> {
    const existing = await this.prisma.appointment.findFirst({
      where: {
        userId,
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
        status: AppointmentStatus.SCHEDULED,
        id: { not: input.excludeId },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      select: { id: true },
    });

    return !!existing;
  }

  // hàm create
  async createSeries(input: {
    userId: string;
    title: string;
    description?: string | null;
    recurrenceType: RecurrenceType;
    weeklyDay: Weekday[];
    monthlyDay?: number | null;
    yearlyDay?: number | null;
    yearlyMonth?: number | null;
    seriesTimezone: string;
    startAt: Date;
    endAt: Date;
    tagIds: string[];
  }): Promise<AppointmentSeriesResponseDto> {
    const result = await this.prisma.appointmentSeries.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        startAt: input.startAt,
        endAt: input.endAt,
        recurrenceType: input.recurrenceType,
        weeklyDay: input.weeklyDay,
        monthlyDay: input.monthlyDay,
        yearlyDay: input.yearlyDay,
        yearlyMonth: input.yearlyMonth,
        seriesTimezone: input.seriesTimezone,
        tags: {
          create: input.tagIds.map(tagId => ({
            tag: {
              connect: { id: tagId }
            }
          })), // nối tagIds đã tồn tại
        }
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        recurrenceType: true,
        weeklyDay: true,
        monthlyDay: true,
        yearlyDay: true,
        yearlyMonth: true,
        seriesTimezone: true,
        cancelledAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            },
          }
        }
      },
    });

    return this.toDto(result)
  }

  // hàm find theo query
  async findAppointmentsSeries(query: AppointmentSeriesQueryDto): Promise<PaginationResponseDto<AppointmentSeriesResponseDto[]>> {
    const { page = 1, limit = 10, userId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentSeriesWhereInput = {
      userId: userId,
    };

    const [items, total] = await Promise.all([this.prisma.appointmentSeries.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        recurrenceType: true,
        weeklyDay: true,
        monthlyDay: true,
        yearlyDay: true,
        yearlyMonth: true,
        seriesTimezone: true,
        cancelledAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            },
          }
        }
      },
    }),
    this.prisma.appointmentSeries.count({ where })]);

    return {
      items: items.map(item => this.toDto(item)), total, page, limit
    };
  }

  // tìm theo id
  async findAppointmentSeriesByIdForUser(input: {
    userId: string;
    seriesId: string;
  }): Promise<AppointmentSeriesResponseDto | null> {
    const result = await this.prisma.appointmentSeries.findFirst({
      where: {
        id: input.seriesId,
        userId: input.userId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        recurrenceType: true,
        weeklyDay: true,
        monthlyDay: true,
        yearlyDay: true,
        yearlyMonth: true,
        seriesTimezone: true,
        cancelledAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            },
          }
        }
      },
    });

    return result ? this.toDto(result) : null;
  }

  async updateSeriesByIdForUser(input: {
    userId: string;
    seriesId: string;
    data: UpdateAppointmentSeriesRequestDto
  }): Promise<AppointmentSeriesResponseDto | null> {

    const { tagIds = [], ...updateData } = input.data;
    const updated = await this.prisma.appointmentSeries.update({
      where: {
        id: input.seriesId,
        userId: input.userId,
      },
      data: {
        ...updateData,
        tags: tagIds
          ? {
            deleteMany: {}, // xóa tất cả tag cũ nếu có tagIds mới
            create: tagIds.map(tagId => ({
              tag: { connect: { id: tagId } }
            }))
          }
          : undefined // nếu tagIds không gửi, giữ nguyên
      },

    });

    return this.findAppointmentSeriesByIdForUser({
      userId: updated.userId,
      seriesId: updated.id,
    });
  }

  async deleteSeriesByIdForUser(input: {
    userId: string;
    seriesId: string;
  }) {
    return this.prisma.appointmentSeries.delete({
      where: {
        id: input.seriesId,
        userId: input.userId,
      },
    });
  }

  async findFutureAppointmentsBySeries(input: {
    userId: string;
    seriesId: string;
    from: Date;
  }): Promise<Array<{ id: string }>> {
    return this.prisma.appointment.findMany({
      where: {
        userId: input.userId,
        seriesId: input.seriesId,
        startsAt: { gte: input.from },
      },
      select: { id: true },
    });
  }

  async deleteRemindersByAppointmentIds(
    appointmentIds: string[],
  ): Promise<number> {
    if (appointmentIds.length === 0) {
      return 0;
    }
    const deleted = await this.prisma.reminder.deleteMany({
      where: {
        appointmentId: { in: appointmentIds },
      },
    });
    return deleted.count;
  }

  async findReminderIdsByAppointmentIds(
    appointmentIds: string[],
  ): Promise<string[]> {
    if (appointmentIds.length === 0) {
      return [];
    }

    const reminders = await this.prisma.reminder.findMany({
      where: {
        appointmentId: { in: appointmentIds },
      },
      select: { id: true },
    });

    return reminders.map((r) => r.id);
  }

  async deleteFutureAppointmentsBySeries(input: {
    userId: string;
    seriesId: string;
    from: Date;
  }): Promise<number> {
    const deleted = await this.prisma.appointment.deleteMany({
      where: {
        userId: input.userId,
        seriesId: input.seriesId,
        startsAt: { gte: input.from },
      },
    });
    return deleted.count;
  }
}

