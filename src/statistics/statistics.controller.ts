import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { StatisticsService } from './statistics.service';
import {
  GetStatisticsQueryDto,
  StatisticsSummaryResponseDto,
  ExportAppointmentsQueryDto,
} from './dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /statistics/me
   *
   * Retrieve personal productivity statistics for a given date range.
   * Requires authentication.
   *
   * Query Parameters:
   * - startDate (required): ISO 8601 datetime
   * - endDate (required): ISO 8601 datetime
   * - groupBy (optional): 'day' or 'week' (default: 'day')
   * - timezone (optional): IANA timezone identifier (default: 'UTC')
   *
   * Response: StatisticsSummaryResponseDto with aggregated metrics and trend data
   */
  @Get('me')
  async getStatistics(
    @Request() req: any,
    @Query() query: GetStatisticsQueryDto,
  ): Promise<StatisticsSummaryResponseDto> {
    const userId = req.user.sub; // JWT subject claim contains user ID
    const userTimezone = req.user.timezone || 'UTC'; // User timezone from token

    return this.statisticsService.getStatistics(userId, userTimezone, query);
  }

  /**
   * GET /export
   *
   * Export personal appointments as CSV.
   * Requires authentication.
   *
   * Query Parameters:
   * - startDate (optional): ISO 8601 datetime
   * - endDate (optional): ISO 8601 datetime
   * - tagId (optional): UUID of tag to filter by
   * - status (optional): SCHEDULED, COMPLETED, CANCELLED, or MISSED
   * - query (optional): Search query string (max 255 chars)
   *
   * Response: CSV file download
   */
  @Get('export')
  @HttpCode(200)
  async exportAppointments(
    @Request() req: any,
    @Query() query: ExportAppointmentsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user.sub;
    const userTimezone = query.timezone || req.user.timezone || 'UTC';

    const csvData = await this.statisticsService.exportAppointments(
      userId,
      userTimezone,
      query,
    );

    res.setHeader('Content-Type', csvData.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${csvData.fileName}"`,
    );
    res.send(csvData.content);
  }
}
