import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetAppointmentsQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? value : Number(value),
  )
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? value : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

