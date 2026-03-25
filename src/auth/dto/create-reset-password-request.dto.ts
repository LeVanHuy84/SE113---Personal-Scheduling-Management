import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateResetPasswordRequestDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  newPassword!: string;
}
