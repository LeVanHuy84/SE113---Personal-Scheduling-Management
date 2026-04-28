import { AppointmentStatus } from '@prisma/client';

export class TeamAppointmentListItemDto {
  id: string;
  teamId: string;
  organizerId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  participantCount: number;
}

export class TeamAppointmentListResponseDto {
  items: TeamAppointmentListItemDto[];
  page: number;
  limit: number;
  total: number;
}
