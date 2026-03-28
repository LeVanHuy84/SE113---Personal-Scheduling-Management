import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NotificationType, ReminderState } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  REMINDER_QUEUE_NAME,
  type ReminderJobPayload,
} from './reminder.constants';

@Processor(REMINDER_QUEUE_NAME)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // async process(job: Job<ReminderJobPayload>): Promise<void> {
  //   const appointmentId = job.data.appointmentId;

  //   const reminder = await this.prisma.reminder.findUnique({
  //     where: { id: appointmentId },
  //     include: {
  //       user: {
  //         select: { email: true },
  //       },
  //       appointment: {
  //         select: {
  //           id: true,
  //           startsAt: true,
  //           series: {
  //             select: {
  //               title: true,
  //               cancelledAt: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!reminder || !reminder.appointment) {
  //     return;
  //   }

  //   if (reminder.appointment.series?.cancelledAt) {
  //     return;
  //   }

  //   this.logger.log(
  //     `[MOCK] Reminder email sent to ${reminder.user.email} for appointment ${reminder.appointment.id}`,
  //   );

  //   await this.prisma.reminder.update({
  //     where: { id: reminder.id },
  //     data: {
  //       // state: ReminderState.TRIGGERED,
  //       nextTriggerAt: new Date(),
  //     },
  //   });

  //   await this.prisma.notification.create({
  //     data: {
  //       userId: reminder.userId,
  //       appointmentId: reminder.appointmentId,
  //       reminderId: reminder.id,
  //       type: NotificationType.REMINDER,
  //       message: `Reminder: ${reminder.appointment.series?.title ?? 'Upcoming appointment'}`,
  //       // scheduledAt: reminder.nextTriggerAt,
  //       triggeredAt: new Date(),
  //     },
  //   });
  // }

  async process(job: Job<{ appointmentId: string }>): Promise<void> {
    const { appointmentId } = job.data;

    // Lấy appointment, kèm user và series
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        series: { select: { id: true, title: true, cancelledAt: true, offsetMinutes: true } },
      },
    });

    if (!appointment) return;

    // Nếu series đã bị hủy
    if (appointment.series?.cancelledAt) return;

    // Tính remindAt dựa trên offset
    const offsetMs = (appointment.series?.offsetMinutes ?? 0) * 60 * 1000;
    const remindAt = new Date(appointment.startsAt.getTime() - offsetMs);

    // Tạo Reminder record
    const reminder = await this.prisma.reminder.create({
      data: {
        appointmentId: appointment.id,
        userId: appointment.userId,
        occurrenceTime: remindAt,
        nextTriggerAt: remindAt,
        jobId: job.id ?? "", // jobId = Bull job id
      },
    });

    // Gửi notification
    await this.prisma.notification.create({
      data: {
        userId: appointment.userId,
        appointmentId: appointment.id,
        reminderId: reminder.id,
        type: NotificationType.REMINDER,
        message: `Reminder: ${appointment.series?.title ?? 'Upcoming appointment'}`,
        triggeredAt: remindAt,
      },
    });

    // Gửi mail (mock)
    this.logger.log(
      `[MOCK] Reminder email sent to ${appointment.user.email} for appointment ${appointment.id}`,
    );

  }
}

