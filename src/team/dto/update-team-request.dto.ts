import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateTeamRequestDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
