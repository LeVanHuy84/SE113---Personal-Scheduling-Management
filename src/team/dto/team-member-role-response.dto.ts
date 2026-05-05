import { TeamRole } from '@prisma/client';

export class TeamMemberRoleResponseDto {
  teamId: string;
  userId: string;
  role: TeamRole;
  updatedById: string;
  updatedAt: Date;
}
