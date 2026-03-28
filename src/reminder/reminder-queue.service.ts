import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  REMINDER_JOB_NAME,
  REMINDER_QUEUE_NAME,
  type ReminderJobPayload,
} from './reminder.constants';

@Injectable()
export class ReminderQueueService {
  constructor(
    @InjectQueue(REMINDER_QUEUE_NAME)
    private readonly reminderQueue: Queue<ReminderJobPayload>,
  ) {}

  async enqueueReminderJob(
    appointmentId: string,
    triggerAt: Date,
  ): Promise<void> {
    const delayMs = Math.max(triggerAt.getTime() - Date.now(), 0);
    await this.reminderQueue.add(
      REMINDER_JOB_NAME,
      { appointmentId },
      {
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async cancelJobs(jobIds: string[]): Promise<void> {
    if (jobIds.length === 0) {
      return;
    }

    await Promise.all(
      jobIds.map(async (jobId) => {
        const job = await this.reminderQueue.getJob(jobId);
        if (job) {
          await job.remove();
        }
      }),
    );
  }
}

