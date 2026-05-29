import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination.query';

export class GetTeamsQueryDto extends PaginationQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  searchText?: string;
}
