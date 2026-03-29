import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { REMINDER_QUEUE_NAME, ReminderJobPayload } from './queue.constants';


@Processor(REMINDER_QUEUE_NAME)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ReminderJobPayload>): Promise<void> {
    this.logger.log(`[PROCESS] Processing reminder job ${job.id}`);
    const { appointmentId } = job.data;

    // Lấy appointment, kèm user và series
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        series: { select: { id: true, title: true, cancelledAt: true, offsetMinutes: true } },
      },
    });


    if (!appointment || appointment.series?.cancelledAt) return;

    // Gửi notification
    await this.prisma.notification.create({
      data: {
        userId: appointment.userId,
        appointmentId: appointment.id,
        type: NotificationType.REMINDER,
        message: `You have scheduled '${appointment.series?.title} at ${appointment.startAt.toISOString().split('')}'`,
        triggeredAt: appointment.startAt,
      },
    });

    // Gửi mail (mock)
    // this.logger.log(
    //   `[MOCK] Reminder email sent to ${appointment.user.email} for appointment ${appointment.id}`,
    // );

  }
}

