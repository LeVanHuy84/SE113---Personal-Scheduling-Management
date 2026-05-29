import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination.query';

export class AppointmentQueryDto extends PaginationQuery {
  @IsOptional()
  @IsUUID('4')
  userId?: string;
}

