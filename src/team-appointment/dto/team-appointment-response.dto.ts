import { AppointmentStatus, ParticipationType } from '@prisma/client';

export class TeamAppointmentParticipantDto {
  userId: string;
  participationType: ParticipationType;
}

export class TeamAppointmentConflictDto {
  userId: string;
  conflictWith: 'PERSONAL_APPOINTMENT' | 'TEAM_APPOINTMENT';
  startAt: Date;
  endAt: Date;
  displayName?: string;
  summary?: string;
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
  hasConflict?: boolean;
  conflicts?: TeamAppointmentConflictDto[];
  createdAt: Date;
  updatedAt: Date;
}
