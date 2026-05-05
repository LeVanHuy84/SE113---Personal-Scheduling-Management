import { TeamRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ChangeMemberRoleRequestDto {
  @IsEnum(TeamRole, {
    message: 'role must be one of: OWNER, ADMIN, MEMBER',
  })
  role: TeamRole;
}
