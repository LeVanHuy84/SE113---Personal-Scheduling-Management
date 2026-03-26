import { AppointmentStatus } from '@prisma/client';

export class AppointmentResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  startTime!: Date;
  endTime!: Date;
  status!: AppointmentStatus;
  createdAt!: Date;
  updatedAt!: Date;
}

