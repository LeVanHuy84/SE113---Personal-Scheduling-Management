jest.mock('../appointment/appointment.repository', () => ({
  AppointmentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../team-appointment/team-appointment.repository', () => ({
  TeamAppointmentRepository: jest.fn().mockImplementation(() => ({})),
}));

import { BadRequestException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarItemType } from './dto/calendar-item.dto';

describe('CalendarService', () => {
  let service: CalendarService;
  const mockAppointmentRepository: any = {};
  const mockTeamAppointmentRepository: any = {};

  beforeEach(() => {
    service = new CalendarService(
      mockAppointmentRepository,
      mockTeamAppointmentRepository,
    );
  });

  it('returns both personal and team appointments', async () => {
    mockAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([
        {
          id: 'personal-1',
          startAt: new Date('2026-05-10T09:00:00.000Z'),
          endAt: new Date('2026-05-10T10:00:00.000Z'),
          series: { title: 'Doctor visit' },
        },
      ]);
    mockTeamAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([
        {
          id: 'team-1',
          teamId: 'team-1',
          title: 'Sprint planning',
          startAt: new Date('2026-05-10T11:00:00.000Z'),
          endAt: new Date('2026-05-10T12:00:00.000Z'),
        },
      ]);

    const result = await service.getCalendar('user-1', {
      from: '2026-05-10T00:00:00.000Z',
      to: '2026-05-11T00:00:00.000Z',
      includePersonal: true,
    } as any);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].type).toBe(CalendarItemType.PERSONAL);
    expect(result.items[1].type).toBe(CalendarItemType.TEAM);
  });

  it('filters by time range correctly', async () => {
    mockAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([
        {
          id: 'personal-1',
          startAt: new Date('2026-05-10T09:00:00.000Z'),
          endAt: new Date('2026-05-10T10:00:00.000Z'),
          series: { title: 'Doctor visit' },
        },
      ]);
    mockTeamAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([]);

    await service.getCalendar('user-1', {
      from: '2026-05-10T00:00:00.000Z',
      to: '2026-05-11T00:00:00.000Z',
    } as any);

    expect(
      mockAppointmentRepository.findCalendarAppointments,
    ).toHaveBeenCalledWith({
      userId: 'user-1',
      from: new Date('2026-05-10T00:00:00.000Z'),
      to: new Date('2026-05-11T00:00:00.000Z'),
    });
    expect(
      mockTeamAppointmentRepository.findCalendarAppointments,
    ).toHaveBeenCalledWith({
      userId: 'user-1',
      from: new Date('2026-05-10T00:00:00.000Z'),
      to: new Date('2026-05-11T00:00:00.000Z'),
      teamIds: undefined,
    });
  });

  it('excludes unauthorized team data by relying on repository-scoped visibility', async () => {
    mockAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([]);
    mockTeamAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([]);

    const result = await service.getCalendar('user-1', {
      from: '2026-05-10T00:00:00.000Z',
      to: '2026-05-11T00:00:00.000Z',
      teamIds: ['team-1'],
    } as any);

    expect(result.items).toEqual([]);
    expect(
      mockTeamAppointmentRepository.findCalendarAppointments,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        teamIds: ['team-1'],
      }),
    );
  });

  it('handles empty result', async () => {
    mockAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([]);
    mockTeamAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([]);

    await expect(
      service.getCalendar('user-1', {
        from: '2026-05-10T00:00:00.000Z',
        to: '2026-05-11T00:00:00.000Z',
      } as any),
    ).resolves.toEqual({ items: [] });
  });

  it('respects includePersonal flag', async () => {
    mockAppointmentRepository.findCalendarAppointments = jest.fn();
    mockTeamAppointmentRepository.findCalendarAppointments = jest
      .fn()
      .mockResolvedValue([]);

    await service.getCalendar('user-1', {
      from: '2026-05-10T00:00:00.000Z',
      to: '2026-05-11T00:00:00.000Z',
      includePersonal: false,
    } as any);

    expect(
      mockAppointmentRepository.findCalendarAppointments,
    ).not.toHaveBeenCalled();
    expect(
      mockTeamAppointmentRepository.findCalendarAppointments,
    ).toHaveBeenCalled();
  });

  it('rejects invalid date range', async () => {
    mockAppointmentRepository.findCalendarAppointments = jest.fn();
    mockTeamAppointmentRepository.findCalendarAppointments = jest.fn();

    await expect(
      service.getCalendar('user-1', {
        from: '2026-05-11T00:00:00.000Z',
        to: '2026-05-10T00:00:00.000Z',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
