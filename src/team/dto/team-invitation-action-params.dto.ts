import { IsUUID } from 'class-validator';

export class TeamInvitationActionParamsDto {
  @IsUUID('4')
  teamId: string;

  @IsUUID('4')
  invitationId: string;
}
