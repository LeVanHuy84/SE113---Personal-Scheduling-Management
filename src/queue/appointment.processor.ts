import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { AppointmentRepository } from '../appointment/appointment.repository';
import { APPOINTMENT_JOB_NAME, APPOINTMENT_QUEUE_NAME, AppointmentJobPayload, MISSED_APPOINTMENT_QUEUE_NAME, REMINDER_JOB_NAME, REMINDER_QUEUE_NAME, ReminderJobPayload } from './queue.constants';


@Processor(APPOINTMENT_QUEUE_NAME)
export class AppointmentProcessor extends WorkerHost {
  private readonly logger = new Logger(AppointmentProcessor.name);

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    @InjectQueue(REMINDER_QUEUE_NAME)
    private readonly reminderQueue: Queue<ReminderJobPayload>,

    @InjectQueue(MISSED_APPOINTMENT_QUEUE_NAME)
    private readonly missedAppointmentQueue: Queue<{ appointmentId: string }>,
  ) {
    super();
  }

  async process(job: Job<AppointmentJobPayload>): Promise<void> {

    this.logger.log(`[PROCESS] Processing appointment job ${job.id} data: ${job.data}`);

    const { data } = job.data;
    const now = new Date();
    const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      data.startAt = new Date(data.startAt);
      data.endAt = new Date(data.endAt);

      const occurrences = await this.appointmentRepository.expandSeries(data, now, horizon);

      const jobMappings: { appointmentId: string, jobId: string }[] = [];

      for (const occ of occurrences) {
        const delayMs = Math.max(occ.occurrence.getTime() - Date.now(), 0);
        const [job, _] = await Promise.all([

          await this.reminderQueue.add(
            REMINDER_JOB_NAME,
            { appointmentId: occ.id },
            {
              delay: delayMs,
              removeOnComplete: true,
              removeOnFail: false,
            },
          ),

          await this.missedAppointmentQueue.add(
            APPOINTMENT_JOB_NAME,
            {
              appointmentId: occ.id,
            },
            {
              delay: occ.occurrence.getTime(),
              removeOnComplete: true,
              removeOnFail: false,
            },
          )
        ])

        if (job.id) {
          jobMappings.push({ appointmentId: occ.id, jobId: job.id })
        }
      }

      await this.appointmentRepository.updateAppointmentsWithJob(jobMappings);
    } catch (error) {
      this.logger.log(error);
      throw error;
    }
  }
}

@Processor(MISSED_APPOINTMENT_QUEUE_NAME)
export class MissedAppointmentProcessor extends WorkerHost {
  constructor(private readonly appointmentRepo: AppointmentRepository) { super(); }

  async process(job: Job<{ appointmentId: string }>) {
    await this.appointmentRepo.markMissedAppointments(job.data.appointmentId);
  }

}
