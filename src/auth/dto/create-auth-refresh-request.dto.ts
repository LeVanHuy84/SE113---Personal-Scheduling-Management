import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAuthRefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
