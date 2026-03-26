import { IsEmail, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateResendVerificationEmailRequestDto {
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @MaxLength(255)
  @IsNotEmpty()
  email!: string;
}
