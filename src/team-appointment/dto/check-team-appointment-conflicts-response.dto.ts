import { TeamAppointmentConflictDto } from './team-appointment-response.dto';

export class AvailabilityParticipantDto {
  userId: string;
  displayName: string;
}

export class SuggestedSlotDto {
  startAt: Date;
  endAt: Date;
}

export class CheckTeamAppointmentConflictsResponseDto {
  teamId: string;
  startAt: Date;
  endAt: Date;
  hasConflict: boolean;
  availableParticipants: AvailabilityParticipantDto[];
  busyParticipants: AvailabilityParticipantDto[];
  conflicts: TeamAppointmentConflictDto[];
  suggestedSlots: SuggestedSlotDto[];
}
