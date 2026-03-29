import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsDate, IsEmpty, IsOptional } from 'class-validator';
import { CreateAppointmentSeriesRequestDto } from './create-series-request.dto';

const UPDATE_SCOPES = ['single', 'series'] as const;
export type UpdateAppointmentScope = (typeof UPDATE_SCOPES)[number];

export class UpdateAppointmentSeriesRequestDto extends PartialType(CreateAppointmentSeriesRequestDto) {
  @IsOptional()
  @IsEmpty()
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
  cancelledAt: Date;
}

