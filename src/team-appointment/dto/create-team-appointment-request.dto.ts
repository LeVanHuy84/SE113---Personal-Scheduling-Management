import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  ArrayUnique,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum ParticipantSelectionMode {
  ALL = 'ALL',
  CUSTOM = 'CUSTOM',
}

export class CreateTeamAppointmentRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsEnum(ParticipantSelectionMode, {
    message: 'participantSelectionMode must be one of: ALL, CUSTOM',
  })
  participantSelectionMode?: ParticipantSelectionMode =
    ParticipantSelectionMode.ALL;

  @ValidateIf(
    (dto) => dto.participantSelectionMode === ParticipantSelectionMode.CUSTOM,
  )
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  participantUserIds?: string[];
}
