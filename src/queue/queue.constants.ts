import { AppointmentSeriesResponseDto } from "src/appointment-series/dto/series-response.dto";

export const REMINDER_QUEUE_NAME = 'reminder-queue';
export const REMINDER_JOB_NAME = 'send-reminder-email';
export const APPOINTMENT_QUEUE_NAME = 'appointment-queue';

export const MISSED_APPOINTMENT_QUEUE_NAME = 'missed-appointment-queue'
export const APPOINTMENT_JOB_NAME = 'mark-appointment-missed'

export type ReminderJobPayload = {
    appointmentId: string;

};

export type AppointmentJobPayload = {
    data: AppointmentSeriesResponseDto;
};