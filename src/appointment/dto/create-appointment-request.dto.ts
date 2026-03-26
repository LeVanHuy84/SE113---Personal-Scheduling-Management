import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { IsAppointmentTimeRange } from '../validators/appointment-time-range.decorator';

export class CreateAppointmentRequestDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return value;
  })
  @IsDate()
  @IsAppointmentTimeRange()
  startTime!: Date;

  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return value;
  })
  @IsDate()
  endTime!: Date;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}

