import { Injectable, BadRequestException } from '@nestjs/common';
import { StatisticsRepository } from './statistics.repository';
import {
  GetStatisticsQueryDto,
  GroupByEnum,
  StatisticsSummaryResponseDto,
  StatisticsTrendPointDto,
  ExportAppointmentsQueryDto,
  ExportCsvResponseDto,
} from './dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly repository: StatisticsRepository) {}

  /**
   * Parse and validate ISO 8601 datetime string.
   */
  private parseIsoDate(isoString: string): Date {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return date;
  }

  /**
   * Get hour of day (0-23) for a date in the specified timezone.
   */
  private getHourInTimezone(date: Date, timezone: string): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        hour12: false,
        timeZone: timezone,
      });
      const parts = formatter.formatToParts(date);
      const hourPart = parts.find((p) => p.type === 'hour');
      return hourPart ? parseInt(hourPart.value, 10) : 0;
    } catch (e) {
      // Invalid timezone, fall back to UTC
      return date.getUTCHours();
    }
  }

  /**
   * Format date as YYYY-MM-DD in the specified timezone.
   */
  private formatDateInTimezone(date: Date, timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      });
      return formatter.format(date);
    } catch (e) {
      // Invalid timezone, fall back to UTC
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Format date and time as YYYY-MM-DD HH:mm:ss in the specified timezone.
   */
  private formatDateTimeInTimezone(date: Date, timezone: string): string {
    try {
      const dateStr = this.formatDateInTimezone(date, timezone);
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
      });
      const timeParts = timeFormatter.formatToParts(date);
      const hour = timeParts.find((p) => p.type === 'hour')?.value || '00';
      const minute = timeParts.find((p) => p.type === 'minute')?.value || '00';
      const second = timeParts.find((p) => p.type === 'second')?.value || '00';
      return `${dateStr} ${hour}:${minute}:${second}`;
    } catch (e) {
      // Invalid timezone, fall back to UTC
      return date.toISOString().replace('T', ' ').substring(0, 19);
    }
  }

  /**
   * Get the start and end dates of the ISO week containing the given date.
   * Returns [startDate, endDate] in YYYY-MM-DD format.
   */
  private getIsoWeekRange(date: Date, timezone: string): [string, string] {
    try {
      // Get the date in the target timezone
      const dateStr = this.formatDateInTimezone(date, timezone);
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);

      // Calculate ISO week start (Monday)
      const dayOfWeek = localDate.getDay(); // 0 = Sunday
      const diff = localDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(localDate.setDate(diff));

      // Week end is 6 days later (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = this.formatDateInTimezone(weekStart, timezone);
      const endStr = this.formatDateInTimezone(weekEnd, timezone);

      return [startStr, endStr];
    } catch (e) {
      // Fallback: return date as both start and end
      const dateStr = this.formatDateInTimezone(date, timezone);
      return [dateStr, dateStr];
    }
  }

  /**
   * Retrieve personal productivity statistics for a given date range.
   *
   * Business Logic:
   * 1. Validate date range
   * 2. Filter appointments by userId and date range
   * 3. Calculate totals (all statuses)
   * 4. Calculate completion rate
   * 5. Find most productive hour (completed appointments only)
   * 6. Generate trend data (grouped by day or week)
   * 7. Optimize for full-month queries using UserMonthlyStat if possible
   *
   * @param userId User ID from JWT token
   * @param userTimezone User's configured timezone
   * @param query Statistics query parameters (startDate, endDate, groupBy, timezone)
   * @returns StatisticsSummaryResponseDto
   */
  async getStatistics(
    userId: string,
    userTimezone: string,
    query: GetStatisticsQueryDto,
  ): Promise<StatisticsSummaryResponseDto> {
    // Validate and parse dates
    const startDateTime = this.parseIsoDate(query.startDate);
    const endDateTime = this.parseIsoDate(query.endDate);
    const timezone = query.timezone || 'UTC';
    const groupBy = query.groupBy || GroupByEnum.DAY;

    if (startDateTime >= endDateTime) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Attempt to use UserMonthlyStat if query covers a full calendar month
    const monthlyStatResult = await this.tryGetMonthlyStats(
      userId,
      startDateTime,
      endDateTime,
      timezone,
      groupBy,
    );

    if (monthlyStatResult) {
      return monthlyStatResult;
    }

    // Fallback: compute from Appointment table
    return this.computeStatisticsFromAppointments(
      userId,
      startDateTime,
      endDateTime,
      timezone,
      groupBy,
    );
  }

  /**
   * Try to fetch pre-computed monthly statistics if the query covers an exact calendar month.
   */
  private async tryGetMonthlyStats(
    userId: string,
    startDateTime: Date,
    endDateTime: Date,
    timezone: string,
    groupBy: GroupByEnum,
  ): Promise<StatisticsSummaryResponseDto | null> {
    // Get date strings in the target timezone
    const startDateStr = this.formatDateInTimezone(startDateTime, timezone);
    const endDateStr = this.formatDateInTimezone(endDateTime, timezone);

    const [startYear, startMonth, startDay] = startDateStr
      .split('-')
      .map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

    // Check if the range covers exactly one full calendar month
    const isSingleMonth =
      startYear === endYear &&
      startMonth === endMonth &&
      startDay === 1 &&
      endDay === new Date(endYear, endMonth, 0).getDate();

    if (!isSingleMonth) {
      return null; // Not a full month, fall back to computation
    }

    // Fetch pre-computed monthly stats
    const monthDate = new Date(startYear, startMonth - 1, 1);
    const monthlyStat = await this.repository.findMonthlyStat(
      userId,
      monthDate,
    );

    if (!monthlyStat) {
      return null; // No pre-computed stat, fall back
    }

    // For monthly optimization, we still need to compute trend data
    // (UserMonthlyStat doesn't store per-day/week data)
    // So we fall back to computation for complete trend data
    return null;
  }

  /**
   * Compute statistics directly from Appointment table.
   *
   * Steps:
   * 1. Query all non-deleted appointments in date range
   * 2. Aggregate by status
   * 3. Calculate completion rate
   * 4. Find most productive hour among completed appointments
   * 5. Generate trend points grouped by day/week
   */
  private async computeStatisticsFromAppointments(
    userId: string,
    startDateTime: Date,
    endDateTime: Date,
    timezone: string,
    groupBy: GroupByEnum,
  ): Promise<StatisticsSummaryResponseDto> {
    // Fetch all appointments in the date range
    const appointments = await this.repository.findAppointmentsByDateRange(
      userId,
      startDateTime,
      endDateTime,
    );

    // Aggregate by status
    let totalCount = 0;
    let completedCount = 0;
    const statusCounts = {
      SCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      MISSED: 0,
    };

    for (const apt of appointments) {
      totalCount++;
      statusCounts[apt.status]++;
      if (apt.status === AppointmentStatus.COMPLETED) {
        completedCount++;
      }
    }

    // Calculate completion rate
    const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

    // Find most productive slot (hour with highest frequency of completed appointments)
    const mostProductiveSlot = this.calculateMostProductiveSlot(
      appointments,
      timezone,
    );

    // Generate trend data
    const trend = this.calculateTrend(appointments, timezone, groupBy);

    // Format period dates
    const periodStart = startDateTime.toISOString();
    const periodEnd = endDateTime.toISOString();

    return {
      periodStart,
      periodEnd,
      totalAppointments: totalCount,
      completedAppointments: completedCount,
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimals
      mostProductiveSlot,
      trend,
    };
  }

  /**
   * Calculate the most productive time slot.
   *
   * Groups completed appointments by hour (0–23) in the user's timezone.
   * Returns the hour with the highest frequency.
   * Returns null if no completed appointments.
   */
  private calculateMostProductiveSlot(
    appointments: Array<{ status: AppointmentStatus; startAt: Date }>,
    timezone: string,
  ): string | null {
    const completedAppointments = appointments.filter(
      (apt) => apt.status === AppointmentStatus.COMPLETED,
    );

    if (completedAppointments.length === 0) {
      return null;
    }

    // Count frequency per hour
    const hourCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) {
      hourCounts[h] = 0;
    }

    for (const apt of completedAppointments) {
      const hour = this.getHourInTimezone(apt.startAt, timezone);
      hourCounts[hour]++;
    }

    // Find hour with max frequency
    let maxHour = 0;
    let maxCount = hourCounts[0];
    for (let h = 1; h < 24; h++) {
      if (hourCounts[h] > maxCount) {
        maxCount = hourCounts[h];
        maxHour = h;
      }
    }

    return maxCount > 0 ? maxHour.toString().padStart(2, '0') : null;
  }

  /**
   * Generate trend data grouped by day or week.
   *
   * For each group (day/week), returns:
   * - bucket: date or date range label
   * - total: all appointments in that bucket
   * - completed: completed appointments in that bucket
   */
  private calculateTrend(
    appointments: Array<{ startAt: Date; status: AppointmentStatus }>,
    timezone: string,
    groupBy: GroupByEnum,
  ): StatisticsTrendPointDto[] {
    const buckets: Record<string, { total: number; completed: number }> = {};

    for (const apt of appointments) {
      let bucket: string;

      if (groupBy === GroupByEnum.DAY) {
        bucket = this.formatDateInTimezone(apt.startAt, timezone);
      } else {
        // WEEK: use ISO week format (week starting Monday)
        const [weekStart, weekEnd] = this.getIsoWeekRange(
          apt.startAt,
          timezone,
        );
        bucket = `${weekStart} - ${weekEnd}`;
      }

      if (!buckets[bucket]) {
        buckets[bucket] = { total: 0, completed: 0 };
      }

      buckets[bucket].total++;
      if (apt.status === AppointmentStatus.COMPLETED) {
        buckets[bucket].completed++;
      }
    }

    // Convert to sorted array
    return Object.entries(buckets)
      .map(([bucket, counts]) => ({
        bucket,
        total: counts.total,
        completed: counts.completed,
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  }

  /**
   * Export personal appointments as CSV.
   *
   * Applies filters (date range, tag, status, query) and generates CSV.
   *
   * CSV Format:
   * Headers: Title, Start Time, End Time, Status, Tags, Description, Location
   * Data rows: appointment records
   */
  async exportAppointments(
    userId: string,
    userTimezone: string,
    query: ExportAppointmentsQueryDto,
  ): Promise<ExportCsvResponseDto> {
    // Build where clause
    const where: any = { userId };

    // Date range filter
    if (query.startDate || query.endDate) {
      where.startAt = {};
      if (query.startDate) {
        where.startAt.gte = this.parseIsoDate(query.startDate);
      }
      if (query.endDate) {
        where.startAt.lte = this.parseIsoDate(query.endDate);
      }
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Fetch appointments with related data
    const appointments = await this.repository.findAppointmentsForExport(
      userId,
      where,
    );

    if (appointments.length === 0) {
      throw new BadRequestException(
        'No appointments found matching the provided filters',
      );
    }

    // Ensure all appointments have series (should always be true, but filter for safety)
    let filtered = appointments.filter((apt) => apt.series !== null);

    // Filter by tag if specified
    if (query.tagId) {
      filtered = filtered.filter((apt) =>
        apt.series!.tags.some((t) => t.tag.id === query.tagId),
      );
    }

    // Filter by search query (simple substring match on title/description)
    if (query.query) {
      const q = query.query.toLowerCase();
      filtered = filtered.filter((apt) => {
        const title = apt.series!.title.toLowerCase();
        const desc = (apt.series!.description || '').toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }

    if (filtered.length === 0) {
      throw new BadRequestException(
        'No appointments found matching the provided filters',
      );
    }

    // Generate CSV
    const csv = this.generateCsv(filtered, userTimezone);

    const now = new Date();
    const dateStr = this.formatDateInTimezone(now, userTimezone);
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: userTimezone,
    });
    const timeParts = timeFormatter.formatToParts(now);
    const hour = timeParts.find((p) => p.type === 'hour')?.value || '00';
    const minute = timeParts.find((p) => p.type === 'minute')?.value || '00';
    const second = timeParts.find((p) => p.type === 'second')?.value || '00';
    const fileName = `appointments_${dateStr}_${hour}-${minute}-${second}.csv`;

    return {
      fileName,
      contentType: 'text/csv',
      content: csv,
    };
  }

  /**
   * Generate CSV content from appointment records.
   */
  private generateCsv(appointments: any[], userTimezone: string): string {
    const headers = [
      'Title',
      'Start Time',
      'End Time',
      'Status',
      'Tags',
      'Description',
      'Location',
    ];
    const rows: string[] = [];

    // Add header row
    rows.push(headers.map((h) => this.escapeCsvField(h)).join(','));

    // Add data rows
    for (const apt of appointments) {
      // Skip if series is null (shouldn't happen after filtering, but be safe)
      if (!apt.series) continue;

      const startTime = this.formatDateTimeInTimezone(
        apt.startAt,
        userTimezone,
      );
      const endTime = this.formatDateTimeInTimezone(apt.endAt, userTimezone);
      const tags = apt.series.tags.map((t) => t.tag.name).join('; ');
      const description = apt.series.description || '';

      rows.push(
        [
          this.escapeCsvField(apt.series.title),
          this.escapeCsvField(startTime),
          this.escapeCsvField(endTime),
          this.escapeCsvField(apt.status),
          this.escapeCsvField(tags),
          this.escapeCsvField(description),
          this.escapeCsvField(''), // location field (not available in current model)
        ].join(','),
      );
    }

    return rows.join('\n');
  }

  /**
   * Escape CSV field values (quote if contains comma, newline, or quotes).
   */
  private escapeCsvField(field: string | null | undefined): string {
    if (!field) return '""';
    const escaped = String(field).replace(/"/g, '""');
    if (
      escaped.includes(',') ||
      escaped.includes('\n') ||
      escaped.includes('"')
    ) {
      return `"${escaped}"`;
    }
    return escaped;
  }
}
