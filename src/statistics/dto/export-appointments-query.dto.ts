import {
  IsISO8601,
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  MaxLength,
} from 'class-validator';

export enum AppointmentStatusEnum {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MISSED = 'MISSED',
}

export class ExportAppointmentsQueryDto {
  /**
   * Start of date range filter (ISO 8601 format).
   * Optional; if provided, must be <= endDate.
   */
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  /**
   * End of date range filter (ISO 8601 format).
   * Optional; if provided, must be >= startDate.
   */
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  /**
   * Filter by tag UUID.
   * Optional; tag must belong to the authenticated user.
   */
  @IsOptional()
  @IsUUID()
  tagId?: string;

  /**
   * Filter by appointment status.
   * Optional; can be one of SCHEDULED, COMPLETED, CANCELLED, MISSED.
   */
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: AppointmentStatusEnum;

  /**
   * Search query string (full-text search on title/description).
   * Optional; max length 255 characters.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  query?: string;
}
