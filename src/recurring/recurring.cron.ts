import { Injectable, Logger } from '@nestjs/common';
import { AppointmentSourceKind, AppointmentStatus, RecurrenceType, ReminderState } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderQueueService } from '../reminder/reminder-queue.service';
type Occurrence = {
  start: Date;
  end: Date;
};

@Injectable()
export class RecurringCron {
  private readonly logger = new Logger(RecurringCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reminderQueueService: ReminderQueueService,
  ) { }

  // @Cron('0 0 * * *') // chạy mỗi ngày 0h
  @Cron('*/5 * * * *') // mỗi 5 phút
  async generateAppointments(): Promise<void> {
    const now = new Date();
    const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const seriesList = await this.prisma.appointmentSeries.findMany({
      where: { cancelledAt: null },
    });

    for (const series of seriesList) {
      const occurrences = this.generateOccurrences(series, now, horizon);

      for (const occ of occurrences) {
        const exists = await this.prisma.appointment.findFirst({
          where: {
            seriesId: series.id,
            startsAt: occ.start,
          },
          select: { id: true },
        });

        if (exists) continue;

        const created = await this.prisma.appointment.create({
          data: {
            userId: series.userId,
            seriesId: series.id,
            startsAt: occ.start,
            endsAt: occ.end,
            status: AppointmentStatus.SCHEDULED,
            isRecurringInstance: true,
          },
        });

        await this.reminderQueueService.enqueueReminderJob(
          created.id,
          new Date(
            occ.start.getTime() - (series.offsetMinutes ?? 0) * 60000,
          ),
        );
      }
    }
  }

  private buildOccurrence(series: any, date: Date) {
    const start = new Date(date);
    const end = new Date(date);

    start.setUTCHours(
      series.startAt.getUTCHours(),
      series.startAt.getUTCMinutes(),
      0,
      0,
    );

    end.setUTCHours(
      series.endAt.getUTCHours(),
      series.endAt.getUTCMinutes(),
      0,
      0,
    );

    return { start, end };
  }

  private generateOccurrences(series: any, from: Date, to: Date): Occurrence[] {
    switch (series.recurrenceType) {
      case 'DAILY':
        return this.generateDaily(series, from, to);

      case 'WEEKLY':
        return this.generateWeekly(series, from, to);

      case 'MONTHLY':
        return this.generateMonthly(series, from, to);

      case 'YEARLY':
        return this.generateYearly(series, from, to);
      case 'ONETIME':
        return [];

      default:
        return [];
    }
  }

  private generateDaily(series: any, from: Date, to: Date): Occurrence[] {
    const result: Occurrence[] = [];
    let cursor = new Date(from);

    while (cursor <= to) {
      result.push(this.buildOccurrence(series, cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return result;
  }

  private generateWeekly(series: any, from: Date, to: Date) {
    const result: Occurrence[] = [];
    const map = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
      'THURSDAY', 'FRIDAY', 'SATURDAY'
    ];

    let cursor = new Date(from);

    while (cursor <= to) {
      const weekday = map[cursor.getUTCDay()];

      if (series.weeklyDay.includes(weekday)) {
        result.push(this.buildOccurrence(series, cursor));
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return result;
  }

  private generateMonthly(series: any, from: Date, to: Date) {
    const result: Occurrence[] = [];

    let cursor = new Date(from);

    while (cursor <= to) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();

      const target = new Date(Date.UTC(year, month, series.monthlyDay));

      if (target >= from && target <= to) {
        result.push(this.buildOccurrence(series, target));
      }

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return result;
  }

  private generateYearly(series: any, from: Date, to: Date) {
    const result: Occurrence[] = [];

    let year = from.getUTCFullYear();

    while (year <= to.getUTCFullYear()) {
      const target = new Date(Date.UTC(
        year,
        series.yearlyMonth - 1,
        series.yearlyDay
      ));

      if (target >= from && target <= to) {
        result.push(this.buildOccurrence(series, target));
      }

      year++;
    }

    return result;
  }


}

