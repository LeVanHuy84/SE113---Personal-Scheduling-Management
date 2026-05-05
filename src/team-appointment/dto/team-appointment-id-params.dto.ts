import { IsUUID } from 'class-validator';

export class TeamAppointmentIdParamsDto {
  @IsUUID('4')
  teamId: string;

  @IsUUID('4')
  id: string;
}
