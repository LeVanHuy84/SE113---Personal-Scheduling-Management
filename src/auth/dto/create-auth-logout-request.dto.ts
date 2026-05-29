import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateAuthLogoutRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
