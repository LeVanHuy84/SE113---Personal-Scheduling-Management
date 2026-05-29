import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentRepository } from '../appointment/appointment.repository';
import { TeamAppointmentRepository } from '../team-appointment/team-appointment.repository';
import {
  CalendarItemDto,
  CalendarItemType,
  CalendarResponseDto,
} from './dto/calendar-item.dto';
import { GetCalendarQueryDto } from './dto/get-calendar.query.dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly teamAppointmentRepository: TeamAppointmentRepository,
  ) {}

  async getCalendar(
    userId: string,
    query: GetCalendarQueryDto,
  ): Promise<CalendarResponseDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from.getTime() >= to.getTime()
    ) {
      throw new BadRequestException('Invalid date range');
    }

    const [personalAppointments, teamAppointments] = await Promise.all([
      query.includePersonal !== false
        ? this.appointmentRepository.findCalendarAppointments({
            userId,
            from,
            to,
          })
        : Promise.resolve([]),
      this.teamAppointmentRepository.findCalendarAppointments({
        userId,
        from,
        to,
        teamIds: query.teamIds,
      }),
    ]);

    const items: CalendarItemDto[] = [
      ...personalAppointments.map((appointment) => ({
        id: appointment.id,
        type: CalendarItemType.PERSONAL,
        title: appointment.series?.title ?? '',
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        teamId: null,
      })),
      ...teamAppointments.map((appointment) => ({
        id: appointment.id,
        type: CalendarItemType.TEAM,
        title: appointment.title,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        teamId: appointment.teamId,
      })),
    ].sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

    return { items };
  }
}
