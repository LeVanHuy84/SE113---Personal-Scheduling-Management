import { AppointmentStatus } from '@prisma/client';

export class TeamAppointmentParticipantDto {
  userId: string;
}

export class TeamAppointmentResponseDto {
  id: string;
  teamId: string;
  organizerId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  participants: TeamAppointmentParticipantDto[];
  createdAt: Date;
  updatedAt: Date;
}
