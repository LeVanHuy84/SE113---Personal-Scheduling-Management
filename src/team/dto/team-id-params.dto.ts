import { IsUUID } from 'class-validator';

export class TeamIdParamsDto {
  @IsUUID('4')
  teamId: string;
}
