import { RecurrenceType, Weekday } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf
} from 'class-validator';
import { IsAppointmentTimeRange } from '../validators/appointment-time-range.decorator';


export class CreateAppointmentSeriesRequestDto {
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
  @IsNotEmpty()
  @IsAppointmentTimeRange()
  startAt: Date;

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
  @IsNotEmpty()
  endAt: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value === undefined ? value : Number(value),
  )
  offsetMinutes?: number;

  @IsEnum(RecurrenceType)
  recurrenceType!: RecurrenceType;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Weekday, { each: true })
  weeklyDay: Weekday[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  @ValidateIf(o => o.recurrenceType === 'MONTHLY')
  monthlyDay?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  @ValidateIf(o => o.recurrenceType === 'YEARLY')
  yearlyDay?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @ValidateIf(o => o.recurrenceType === 'YEARLY')
  yearlyMonth?: number;


  @IsOptional()
  @IsString()
  @Length(1, 64)
  seriesTimezone?: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds: string[];

}

