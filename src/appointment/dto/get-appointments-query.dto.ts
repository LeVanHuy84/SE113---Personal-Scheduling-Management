import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination.query';

export class AppointmentQueryDto extends PaginationQuery {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsUUID('4')
  seriesId?: string;
}

