import { TeamRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateTeamInvitationRequestDto {
  @IsUUID('4')
  invitedUserId: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return value;
  })
  @IsDate()
  expiresAt?: Date;
}
