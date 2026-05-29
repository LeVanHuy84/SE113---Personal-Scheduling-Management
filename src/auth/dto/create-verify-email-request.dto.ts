import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateVerifyEmailRequestDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  token!: string;
}
