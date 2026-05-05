import { InvitationStatus, TeamRole } from '@prisma/client';

export class TeamMyInvitationItemDto {
  invitationId: string;
  teamId: string;
  teamName: string;
  role: TeamRole;
  status: InvitationStatus;
  invitedAt: Date;
  expiresAt: Date | null;
}
