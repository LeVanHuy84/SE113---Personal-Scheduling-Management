import { InvitationStatus, TeamRole } from '@prisma/client';

export class TeamInvitationResponseDto {
  id: string;
  teamId: string;
  invitedUserId: string;
  invitedById: string;
  role: TeamRole;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date | null;
}
