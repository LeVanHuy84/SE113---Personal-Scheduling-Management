import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { CreateAppointmentSeriesRequestDto } from './create-series-request.dto';

export class UpdateAppointmentSeriesRequestDto extends PartialType(CreateAppointmentSeriesRequestDto) {
  @IsOptional()
  @Transform(({ value }) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return value;
  })
  @IsDate()
  cancelledAt?: Date;
}

