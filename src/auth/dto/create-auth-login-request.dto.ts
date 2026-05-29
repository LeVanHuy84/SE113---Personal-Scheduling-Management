import { IsEmail, IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAuthLoginRequestDto {
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @MaxLength(255)
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  password!: string;
}
