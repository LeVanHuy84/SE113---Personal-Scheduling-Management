export const REMINDER_QUEUE_NAME = 'reminder-queue';
export const REMINDER_JOB_NAME = 'send-reminder-email';

export type ReminderJobPayload = {
  appointmentId: string;
};

