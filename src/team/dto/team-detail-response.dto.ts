import { TeamRole } from '@prisma/client';

export class TeamDetailResponseDto {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  myRole: TeamRole;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}
