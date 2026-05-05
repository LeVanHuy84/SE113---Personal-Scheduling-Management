import { Exclude } from 'class-transformer';

/**
 * Represents a single time-series data point.
 * Used for grouping trend data by day or week.
 */
export class StatisticsTrendPointDto {
  /**
   * Date/week label (e.g., "2026-03-15" for daily, "2026-03-15 - 2026-03-21" for weekly).
   */
  bucket: string;

  /**
   * Total appointments in this bucket.
   */
  total: number;

  /**
   * Completed appointments in this bucket.
   */
  completed: number;
}

/**
 * Productivity statistics summary response.
 * Contains aggregated metrics and trend data for a selected time range.
 */
export class StatisticsSummaryResponseDto {
  /**
   * Start of the analyzed period (ISO 8601 format).
   */
  periodStart: string;

  /**
   * End of the analyzed period (ISO 8601 format).
   */
  periodEnd: string;

  /**
   * Total count of all appointments (scheduled, completed, cancelled, missed) in the period.
   */
  totalAppointments: number;

  /**
   * Count of completed appointments.
   */
  completedAppointments: number;

  /**
   * Completion rate: completedAppointments / totalAppointments.
   * Returns 0 if totalAppointments is 0.
   * Rounded to 2 decimal places.
   */
  completionRate: number;

  /**
   * Most productive time slot (hour 0–23) based on highest frequency of completed appointments.
   * null if no completed appointments in the period or if calculation cannot be performed.
   * Example: "14" means 2 PM (14:00) is the most productive hour.
   */
  mostProductiveSlot: string | null;

  /**
   * Time-series trend data points, grouped by day or week.
   */
  trend: StatisticsTrendPointDto[];
}
