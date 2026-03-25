import { IsEmail, MaxLength } from 'class-validator';

export class CreateResendVerificationEmailRequestDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
