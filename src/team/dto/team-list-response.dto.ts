import { TeamRole } from '@prisma/client';

export class TeamListItemDto {
  id: string;
  name: string;
  role: TeamRole;
  memberCount: number;
}

export class TeamListResponseDto {
  items: TeamListItemDto[];
  page: number;
  limit: number;
  total: number;
}
