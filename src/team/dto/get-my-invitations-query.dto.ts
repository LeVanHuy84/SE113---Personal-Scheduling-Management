import { InvitationStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export class GetMyInvitationsQueryDto {
  @IsOptional()
  @IsEnum(InvitationStatus, {
    message: 'status must be one of: PENDING, ACCEPTED, DECLINED, EXPIRED',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  status?: InvitationStatus;
}
