import { RecurrenceType } from '@prisma/client';
import { TagResponseDto } from 'src/tag/dto/tag-response.dto';


export class AppointmentSeriesResponseDto {
  id: string;
  userId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  description: string | null;
  recurrenceType: RecurrenceType;
  weeklyDay: string[];
  monthlyDay: number | null;
  yearlyDay: number | null;
  yearlyMonth: number | null;
  seriesTimezone: string;
  cancelledAt: Date | null;
  tags: TagResponseDto[]
}