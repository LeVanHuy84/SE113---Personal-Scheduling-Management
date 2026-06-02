import { AppointmentStatus } from '@prisma/client';
import { TagResponseDto } from 'src/tag/dto/tag-response.dto';


export class AppointmentResponseDto {
  id: string;
  userId: string;
  seriesId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  isRecurringInstance: boolean;
  status: AppointmentStatus;
  jobId: string | null;
  tags: TagResponseDto[];
  recurrenceType: string;
  weeklyDay?: string[];
  monthlyDay?: number | null;
  yearlyDay?: number | null;
  yearlyMonth?: number | null;
  seriesTimezone?: string;
}