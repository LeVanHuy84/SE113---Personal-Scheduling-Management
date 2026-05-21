import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NotificationType, NotificationEventType } from '@prisma/client';
import { Job } from 'bullmq';
import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { REMINDER_QUEUE_NAME, ReminderJobPayload } from './queue.constants';

@Processor(REMINDER_QUEUE_NAME)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<ReminderJobPayload>): Promise<void> {
    this.logger.log(`[PROCESS] Reminder job ${job.id}`);

    const { appointmentId } = job.data;

    // 1. Lấy appointment (FULL 1 lần duy nhất)
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        series: {
          select: {
            title: true,
            cancelledAt: true,
          },
        },
      },
    });

    if (!appointment || appointment.series?.cancelledAt) {
      this.logger.warn(`[SKIP] Appointment invalid: ${appointmentId}`);
      return;
    }

    const title = appointment.series?.title ?? 'Untitled appointment';
    const message = `You have a scheduled appointment '${title}' at ${appointment.startAt.toISOString()}`;

    // 2. chạy song song 2 use-case
    const results = await Promise.allSettled([
      // 🔹 email
      this.emailService.sendReminderEmail({
        to: appointment.user.email,
        displayName: appointment.user.displayName,
        appointmentTitle: title,
        startAt: appointment.startAt,
      }),

      // 🔹 notification (push + DB)
      this.notificationService.sendAndCreateNotification({
        userId: appointment.userId,
        type: NotificationType.REMINDER,
        eventType: NotificationEventType.REMINDER_TRIGGERED,
        appointmentId: appointment.id,
        title: 'Appointment reminder',
        body: message,
        payload: { appointmentTitle: title },
      }),
    ]);

    // 3. log lỗi (không crash job)
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error(`[ERROR] Step ${i} failed`, r.reason);
      }
    });

    this.logger.log(`[DONE] Reminder processed: ${appointmentId}`);
  }
}
