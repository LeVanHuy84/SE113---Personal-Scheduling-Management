import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAuthRegisterRequestDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName!: string;
}
