import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RecurrenceType } from '@prisma/client';
import { PaginationQuery } from 'src/common/dto/pagination.query';

export class AppointmentSeriesQueryDto extends PaginationQuery {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;
}

