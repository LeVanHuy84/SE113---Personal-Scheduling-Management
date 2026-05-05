import {
  IsArray,
  IsDateString,
  ArrayUnique,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';

export class CheckTeamAppointmentConflictsRequestDto {
  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  participantUserIds: string[];
}
