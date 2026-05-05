import { IsISO8601, IsOptional, IsEnum } from 'class-validator';

export enum GroupByEnum {
  DAY = 'day',
  WEEK = 'week',
}

export class GetStatisticsQueryDto {
  /**
   * Start of the analysis period in ISO 8601 format.
   * Must be <= endDate.
   */
  @IsISO8601()
  startDate: string;

  /**
   * End of the analysis period in ISO 8601 format.
   * Must be >= startDate.
   */
  @IsISO8601()
  endDate: string;

  /**
   * Group trend data by day or week.
   * Optional, defaults to 'day'.
   */
  @IsOptional()
  @IsEnum(GroupByEnum)
  groupBy?: GroupByEnum = GroupByEnum.DAY;

  /**
   * IANA timezone identifier for grouping calculations.
   * Optional, defaults to 'UTC'.
   */
  @IsOptional()
  timezone?: string = 'UTC';
}
