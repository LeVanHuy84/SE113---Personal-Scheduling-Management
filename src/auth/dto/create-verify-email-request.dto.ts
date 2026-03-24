import { IsString, MinLength } from 'class-validator';

export class CreateVerifyEmailRequestDto {
  @IsString()
  @MinLength(1)
  token!: string;
}
