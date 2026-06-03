import { Injectable } from '@nestjs/common';
import { Prisma, RecurrenceType, Weekday } from '@prisma/client';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { generateOccurrences } from 'src/common/helper/recurrence.helper';
import { TagResponseDto } from 'src/tag/dto/tag-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentSeriesQueryDto } from './dto/get-series-query.dto';
import { AppointmentSeriesResponseDto } from './dto/series-response.dto';
import { UpdateAppointmentSeriesRequestDto } from './dto/update-series-request.dto';


@Injectable()
export class AppointmentSeriesRepository {
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

  async hasConflict(
    userId: string,
    proposedSeries: {
      startAt: Date;
      endAt: Date;
      recurrenceType: RecurrenceType;
      weeklyDay?: Weekday[];
      monthlyDay?: number | null;
      yearlyDay?: number | null;
      yearlyMonth?: number | null;
    },
    excludeSeriesId?: string
  ): Promise<boolean> {
    const from = proposedSeries.startAt;
    const to = new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000); // Check conflicts for up to 1 year
    const proposedOccurrences = generateOccurrences(proposedSeries, from, to);
    
    if (proposedOccurrences.length === 0) return false;

    // Expand search window backward by 24h to catch appointments that started before `from` but overlap
    const searchFrom = new Date(from.getTime() - 24 * 60 * 60 * 1000); 

    // 1️⃣ Lấy series chưa hủy của user
    const seriesList = await this.prisma.appointmentSeries.findMany({
      where: { 
        userId, 
        cancelledAt: null,
        ...(excludeSeriesId ? { id: { not: excludeSeriesId } } : {})
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        recurrenceType: true,
        weeklyDay: true,
        monthlyDay: true,
        yearlyDay: true,
        yearlyMonth: true,
        offsetMinutes: true,
      },
    });

    for (const series of seriesList) {
      // 2️⃣ Generate occurrences trong khoảng searchFrom..to
      const occurrences = generateOccurrences(series, searchFrom, to);

      // 3️⃣ Kiểm tra overlap
      for (const pOcc of proposedOccurrences) {
        for (const occ of occurrences) {
          if (pOcc.start < occ.end && pOcc.end > occ.start) {
            return true; // xung đột với personal appointment
          }
        }
      }
    }

    // 4️⃣ Kiểm tra xung đột với Team Appointments
    const teamAppointments = await this.prisma.teamAppointment.findMany({
      where: {
        status: 'SCHEDULED', // AppointmentStatus.SCHEDULED
        startAt: { lt: to },
        endAt: { gt: from },
        participants: {
          some: {
            userId: userId,
            participationType: 'REQUIRED', // ParticipationType.REQUIRED
          },
        },
      },
      select: { startAt: true, endAt: true },
    });

    for (const pOcc of proposedOccurrences) {
      for (const tApp of teamAppointments) {
        if (pOcc.start < tApp.endAt && pOcc.end > tApp.startAt) {
          return true; // xung đột với team appointment
        }
      }
    }

    return false; // không xung đột
  }

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

  async findSeries(query: AppointmentSeriesQueryDto): Promise<PaginationResponseDto<AppointmentSeriesResponseDto[]>> {
    const { page = 1, limit = 10, userId, recurrenceType } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentSeriesWhereInput = {
      userId: userId,
    };

    if (recurrenceType) {
      where.recurrenceType = recurrenceType;
    }

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

  async findById(id: string) {
    return this.prisma.appointmentSeries.findUnique({
      where: { id },
      select: {
        id: true,
        recurrenceType: true,
        weeklyDay: true,
        monthlyDay: true,
        yearlyDay: true,
        yearlyMonth: true,
      }
    });
  }

  async updateSeries(input: {
    id: string;
    data: UpdateAppointmentSeriesRequestDto
  }): Promise<AppointmentSeriesResponseDto> {
    const { tagIds, ...updateData } = input.data;
    const updated = await this.prisma.appointmentSeries.update({
      where: {
        id: input.id,
      },
      data: {
        ...updateData,
        tags: tagIds !== undefined 
          ? {
            deleteMany: {}, // xóa tất cả tag cũ nếu có tagIds mới
            create: tagIds.map(tagId => ({
              tag: { connect: { id: tagId } }
            }))
          }
          : undefined // nếu tagIds không gửi, giữ nguyên
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

    return this.toDto(updated);
  }

  async deleteSeries(input: {
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

}

