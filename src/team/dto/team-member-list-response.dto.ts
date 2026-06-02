import { MembershipStatus, TeamRole } from '@prisma/client';

export class TeamMemberItemDto {
  userId: string;
  displayName: string | null;
  email: string;
  role: TeamRole;
  status: MembershipStatus;
  joinedAt: Date;
}

export class TeamMemberListResponseDto {
  items: TeamMemberItemDto[];
  page: number;
  limit: number;
  total: number;
}
