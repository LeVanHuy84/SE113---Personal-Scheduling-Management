import { IsUUID } from 'class-validator';

export class GetAppointmentByIdParamsDto {
  @IsUUID()
  id!: string;
}

