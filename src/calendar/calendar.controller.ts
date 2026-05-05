import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCalendarQueryDto } from './dto/get-calendar.query.dto';
import { CalendarResponseDto } from './dto/calendar-item.dto';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getCalendar(
    @CurrentUser() user: CurrentUserPrincipal,
    @Query() query: GetCalendarQueryDto,
  ): Promise<CalendarResponseDto> {
    return this.calendarService.getCalendar(user.userId, query);
  }
}
