import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { generateOccurrences } from 'src/common/helper/recurrence.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { TagResponseDto } from 'src/tag/dto/tag-response.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { AppointmentQueryDto } from './dto/get-appointments-query.dto';

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  toDto(entity): AppointmentResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      seriesId: entity.series?.id,
      title: entity.series?.title,
      description: entity.series?.description ?? null,
      startAt: entity.startsAt,
      endAt: entity.endsAt,
      isRecurringInstance: entity.isRecurringInstance,
      jobId: entity.jobId,
      status: entity.status,
      tags: (entity.series?.tags ?? []).map((t) => ({
        id: t.tag.id,
        name: t.tag.name,
        color: t.tag.color,
      })) as TagResponseDto[],
    };
  }

  async expandSeries(
    pattern: {
      id: string;
      userId: string;
      startAt: Date;
      endAt: Date;
      recurrenceType: any;
      weeklyDay?: any[];
      monthlyDay?: number | null;
      yearlyDay?: number | null;
      yearlyMonth?: number | null;
      offsetMinutes?: number | null;
    },
    from: Date,
    to: Date,
  ): Promise<{ id: string; occurrence: Date }[]> {
    // 🔹 1. Tạo occurrences từ helper
    const occurrences = generateOccurrences(pattern, from, to);
    if (!occurrences.length) return [];

    // 🔹 2. Lấy tất cả appointment đã tồn tại trong khoảng
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        seriesId: pattern.id,
        isRecurringInstance: true,
        startAt: {
          gte: new Date(Math.min(...occurrences.map((o) => o.start.getTime()))),
          lte: new Date(Math.max(...occurrences.map((o) => o.start.getTime()))),
        },
      },
      select: { startAt: true },
    });

    const existingSet = new Set(
      existingAppointments.map((a) => a.startAt.getTime()),
    );

    // 🔹 3. Lọc các occurrences chưa tồn tại
    const newAppointments = occurrences
      .filter((occ) => !existingSet.has(occ.start.getTime()))
      .map((occ) => ({
        userId: pattern.userId,
        seriesId: pattern.id,
        startAt: occ.start,
        endAt: occ.end,
        status: AppointmentStatus.SCHEDULED,
        isRecurringInstance: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (!newAppointments.length) return [];

    // 🔹 4. Bulk insert
    return (
      await this.prisma.appointment.createManyAndReturn({
        data: newAppointments,
        skipDuplicates: true,
      })
    ).map((a) => ({
      id: a.id,
      occurrence: new Date(
        a.startAt.getTime() - (pattern.offsetMinutes ?? 0) * 60000,
      ),
    }));
  }

  async markMissedAppointments(id: string) {
    const exsiting = await this.prisma.appointment.findFirst({
      where: {
        id: id,
      },
    });
    if (exsiting?.status === 'SCHEDULED') {
      await this.prisma.appointment.update({
        where: {
          id: id,
        },
        data: { status: 'MISSED' },
      });
    }
  }

  async findById(id: string) {
    return this.prisma.appointment.findFirstOrThrow({
      where: {
        id: id,
      },
    });
  }

  async update(arg: Prisma.AppointmentUpdateArgs) {
    const update = await this.prisma.appointment.update(arg);
    return this.toDto(update);
  }

  async findAppointments(
    query: AppointmentQueryDto,
  ): Promise<PaginationResponseDto<AppointmentResponseDto[]>> {
    const { page = 1, limit = 10, userId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      userId: userId,
    };

    if (fromDate || toDate) {
      where.startAt = {};
      if (fromDate) where.startAt.gte = new Date(fromDate);
      if (toDate) where.startAt.lte = new Date(toDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: {
          startAt: 'asc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          startAt: true,
          endAt: true,
          status: true,
          isRecurringInstance: true,
          series: {
            include: {
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDto(item)),
      total,
      page,
      limit,
    };
  }

  async findCalendarAppointments(input: {
    userId: string;
    from: Date;
    to: Date;
  }): Promise<
    Array<{
      id: string;
      startAt: Date;
      endAt: Date;
      series: {
        title: string;
      } | null;
    }>
  > {
    return this.prisma.appointment.findMany({
      where: {
        userId: input.userId,
        startAt: { lt: input.to },
        endAt: { gt: input.from },
      },
      orderBy: {
        startAt: 'asc',
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        series: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  // for cronjob
  async findFutureAppointmentsBySeries(input: {
    userId: string;
    seriesId: string;
    from: Date;
  }): Promise<Array<{ id: string }>> {
    return this.prisma.appointment.findMany({
      where: {
        userId: input.userId,
        seriesId: input.seriesId,
        isRecurringInstance: true,
        startAt: { gte: input.from },
      },
      select: { id: true },
    });
  }

  async updateAppointmentsWithJob(
    updates: { appointmentId: string; jobId: string }[],
  ) {
    if (!updates.length) return;

    // Dùng Promise.all để chạy song song
    await Promise.all(
      updates.map(({ appointmentId, jobId }) =>
        this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { jobId: jobId },
        }),
      ),
    );
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
        startAt: { gte: input.from },
      },
    });
    return deleted.count;
  }
}
