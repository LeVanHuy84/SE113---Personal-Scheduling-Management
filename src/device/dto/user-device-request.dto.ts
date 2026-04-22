import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UserDeviceRequestDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  platform?: string;
}