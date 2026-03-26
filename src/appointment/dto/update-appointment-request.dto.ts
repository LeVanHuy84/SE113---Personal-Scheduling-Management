import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsAppointmentTimeRange } from '../validators/appointment-time-range.decorator';

const UPDATE_SCOPES = ['single', 'series'] as const;
export type UpdateAppointmentScope = (typeof UPDATE_SCOPES)[number];

export class UpdateAppointmentRequestDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return value;
  })
  @IsDate()
  @IsAppointmentTimeRange()
  startTime?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return value;
  })
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(UPDATE_SCOPES)
  scope?: UpdateAppointmentScope;
}

