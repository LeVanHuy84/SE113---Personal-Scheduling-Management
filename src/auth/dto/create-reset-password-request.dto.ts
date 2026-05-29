import { IsString, MaxLength, MinLength, IsNotEmpty } from 'class-validator';

export class CreateResetPasswordRequestDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @IsNotEmpty()
  newPassword!: string;
}
