import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { APPOINTMENT_QUEUE_NAME, AppointmentJobPayload } from 'src/queue/queue.constants';
import { TagResponseDto } from 'src/tag/dto/tag-response.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecurringCron {
  private readonly logger = new Logger(RecurringCron.name);

  constructor(
    private readonly prisma: PrismaService,
    // private readonly appointmentRepository: AppointmentRepository,

    // @InjectQueue(MISSED_APPOINTMENT_QUEUE_NAME)
    // private readonly missedAppointmentQueue: Queue<ReminderJobPayload>,

    // @InjectQueue(REMINDER_QUEUE_NAME)
    // private readonly reminderQueue: Queue<ReminderJobPayload>

    @InjectQueue(APPOINTMENT_QUEUE_NAME)
    private readonly appointmentQueue: Queue<AppointmentJobPayload>,

  ) { }



  // @Cron('0 0 * * *') // chạy mỗi ngày 0h
  // // @Cron('*/1 * * * *') // mỗi 5 phút
  // async generateAppointments(): Promise<void> {
  //   this.logger.log(`[CRON] Work after 5 minutes`);

  //   const now = new Date();
  //   const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  //   const seriesList = await this.prisma.appointmentSeries.findMany({
  //     where: { cancelledAt: null },
  //   });

  //   for (const series of seriesList) {
  //     const occurrences = await this.appointmentRepository.expandSeries(series, now, horizon);
  //     for (const occ of occurrences) {
  //       const delayMs = Math.max(occ.occurrence.getTime() - Date.now(), 0);
  //       await Promise.all([

  //         await this.reminderQueue.add(
  //           REMINDER_JOB_NAME,
  //           { appointmentId: occ.id },
  //           {
  //             delay: delayMs,
  //             removeOnComplete: true,
  //             removeOnFail: false,
  //           },
  //         ),

  //         await this.missedAppointmentQueue.add(
  //           APPOINTMENT_JOB_NAME,
  //           {
  //             appointmentId: occ.id,
  //           },
  //           {
  //             delay: occ.occurrence.getTime(),
  //             removeOnComplete: true,
  //             removeOnFail: false,
  //           },
  //         )
  //       ])
  //     }
  //   }
  // }

  // @Cron('0 0 * * *') // chạy mỗi ngày 0h
  @Cron('*/1 * * * *') // mỗi 5 phút
  async generateAppointments(): Promise<void> {
    this.logger.log(`[CRON] Work after 5 minutes`);

    const seriesList = (await this.prisma.appointmentSeries.findMany({
      where: { cancelledAt: null },
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
    })).map(entity => ({
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
    }));

    for (const series of seriesList) {
      await this.appointmentQueue.add(APPOINTMENT_QUEUE_NAME, { data: series }, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 5
      })
    }
  }
}

