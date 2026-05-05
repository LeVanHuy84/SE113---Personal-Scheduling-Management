import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find appointments within a date range for a specific user.
   * Returns only essential fields for statistics calculation.
   */
  async findAppointmentsByDateRange(
    userId: string,
    startDateTime: Date,
    endDateTime: Date,
  ): Promise<
    Array<{
      id: string;
      startAt: Date;
      endAt: Date;
      status: AppointmentStatus;
    }>
  > {
    return this.prisma.appointment.findMany({
      where: {
        userId,
        startAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    });
  }

  /**
   * Find appointments with series and tags for export.
   * Includes full details for CSV generation.
   */
  async findAppointmentsForExport(
    userId: string,
    where: any,
  ): Promise<
    Array<{
      id: string;
      startAt: Date;
      endAt: Date;
      status: AppointmentStatus;
      series: {
        id: string;
        title: string;
        description: string | null;
        tags: Array<{
          tag: {
            id: string;
            name: string;
          };
        }>;
      };
    }>
  > {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        ...where,
        userId,
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        series: {
          select: {
            id: true,
            title: true,
            description: true,
            tags: {
              select: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return appointments
      .filter(
        (
          appointment,
        ): appointment is {
          id: string;
          startAt: Date;
          endAt: Date;
          status: AppointmentStatus;
          series: {
            id: string;
            title: string;
            description: string | null;
            tags: Array<{
              tag: {
                id: string;
                name: string;
              };
            }>;
          };
        } => appointment.series !== null,
      )
      .map((appointment) => ({
        id: appointment.id,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        status: appointment.status,
        series: appointment.series,
      }));
  }

  /**
   * Find pre-computed monthly statistics.
   */
  async findMonthlyStat(userId: string, monthDate: Date) {
    return this.prisma.userMonthlyStat.findUnique({
      where: {
        userId_month: {
          userId,
          month: monthDate,
        },
      },
    });
  }
}
