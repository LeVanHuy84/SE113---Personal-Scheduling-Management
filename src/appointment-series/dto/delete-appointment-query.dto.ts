import { IsIn, IsOptional, IsString } from 'class-validator';

const DELETE_SCOPES = ['single', 'series'] as const;
export type DeleteAppointmentScope = (typeof DELETE_SCOPES)[number];

export class DeleteAppointmentQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(DELETE_SCOPES)
  scope?: DeleteAppointmentScope;
}

