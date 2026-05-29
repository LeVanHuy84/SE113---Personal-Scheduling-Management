import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination.query';

export class AppointmentSeriesQueryDto extends PaginationQuery {
  @IsOptional()
  @IsUUID('4')
  userId?: string;
}

