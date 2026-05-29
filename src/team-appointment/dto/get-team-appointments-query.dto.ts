import { IsDateString, IsOptional } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination.query';

export class GetTeamAppointmentsQueryDto extends PaginationQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
