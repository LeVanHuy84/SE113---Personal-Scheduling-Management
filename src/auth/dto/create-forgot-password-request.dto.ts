import { IsEmail, MaxLength } from 'class-validator';

export class CreateForgotPasswordRequestDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
