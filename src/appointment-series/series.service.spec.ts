import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RecurrenceType, Weekday } from '@prisma/client';
import { APPOINTMENT_QUEUE_NAME } from 'src/queue/queue.constants';
import { AppointmentSeriesService } from './series.service';

describe('AppointmentSeriesService', () => {
  let service: AppointmentSeriesService;
  let appointmentQueue: { add: jest.Mock };
  let reminderQueue: { remove: jest.Mock };
  let seriesRepository: {
    hasConflict: jest.Mock;
    createSeries: jest.Mock;
    findSeries: jest.Mock;
    updateSeries: jest.Mock;
    deleteSeries: jest.Mock;
  };
  let appointmentRepository: {
    findFutureAppointmentsBySeries: jest.Mock;
    deleteFutureAppointmentsBySeries: jest.Mock;
  };
  let tagRepository: { allTagIdsExist: jest.Mock };

  const userId = '58f0fdcf-9ec4-4f8f-8ee6-cf2d4193f7f2';

  beforeEach(() => {
    appointmentQueue = { add: jest.fn() };
    reminderQueue = { remove: jest.fn() };
    seriesRepository = {
      hasConflict: jest.fn(),
      createSeries: jest.fn(),
      findSeries: jest.fn(),
      updateSeries: jest.fn(),
      deleteSeries: jest.fn(),
    };
    appointmentRepository = {
      findFutureAppointmentsBySeries: jest.fn().mockResolvedValue([]),
      deleteFutureAppointmentsBySeries: jest.fn().mockResolvedValue(0),
    };
    tagRepository = { allTagIdsExist: jest.fn() };

    service = new AppointmentSeriesService(
      appointmentQueue as never,
      reminderQueue as never,
      seriesRepository as never,
      appointmentRepository as never,
      tagRepository as never,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('UTCID01 should create weekly recurring series and enqueue async generation job', async () => {
    const dto = {
      title: 'Weekly Planning',
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
      recurrenceType: RecurrenceType.WEEKLY,
      weeklyDay: [Weekday.MON, Weekday.WED, Weekday.FRI],
      seriesTimezone: 'UTC',
      tagIds: ['f14e2fc6-5d5d-4d9f-871a-c5fb55879de6'],
    };

    seriesRepository.hasConflict.mockResolvedValue(false);
    tagRepository.allTagIdsExist.mockResolvedValue(true);
    seriesRepository.createSeries.mockResolvedValue({ id: 'series-1' });
    appointmentQueue.add.mockResolvedValue({ id: 'job-1' });

    const result = await service.createAppointmentSeries(userId, dto as never);

    expect(result).toEqual({ id: 'series-1' });
    expect(seriesRepository.hasConflict).toHaveBeenCalledWith(
      userId,
      dto.startAt,
      dto.endAt,
    );
    expect(appointmentQueue.add).toHaveBeenCalledWith(
      APPOINTMENT_QUEUE_NAME,
      { data: { id: 'series-1' } },
      expect.objectContaining({ attempts: 5 }),
    );
  });

  it('UTCID03 should reject invalid recurrence payload with 400 style error', async () => {
    const dto = {
      title: 'Invalid recurrence',
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
      recurrenceType: 'INVALID_TYPE',
      weeklyDay: [Weekday.MON],
      tagIds: [],
    };

    await expect(
      service.createAppointmentSeries(userId, dto as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(seriesRepository.createSeries).not.toHaveBeenCalled();
    expect(appointmentQueue.add).not.toHaveBeenCalled();
  });

  it('UTCID06 should reject create series when overlap conflict is detected', async () => {
    const dto = {
      title: 'Conflict series',
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
      recurrenceType: RecurrenceType.WEEKLY,
      weeklyDay: [Weekday.MON],
      tagIds: [],
    };

    seriesRepository.hasConflict.mockResolvedValue(true);

    await expect(
      service.createAppointmentSeries(userId, dto as never),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(seriesRepository.createSeries).not.toHaveBeenCalled();
    expect(appointmentQueue.add).not.toHaveBeenCalled();
  });

  it('UTCID13 should allow series creation when overlap belongs to other user context', async () => {
    const dto = {
      title: 'User scoped overlap',
      startAt: new Date('2026-05-20T08:00:00.000Z'),
      endAt: new Date('2026-05-20T08:59:00.000Z'),
      recurrenceType: RecurrenceType.WEEKLY,
      weeklyDay: [Weekday.MON],
      tagIds: [],
    };

    seriesRepository.hasConflict.mockResolvedValue(false);
    tagRepository.allTagIdsExist.mockResolvedValue(true);
    seriesRepository.createSeries.mockResolvedValue({ id: 'series-13' });
    appointmentQueue.add.mockResolvedValue({ id: 'job-13' });

    const result = await service.createAppointmentSeries(userId, dto as never);

    expect(result).toEqual({ id: 'series-13' });
    expect(seriesRepository.hasConflict).toHaveBeenCalledWith(
      userId,
      dto.startAt,
      dto.endAt,
    );
  });

  it('UTCID04 should reject invalid timezone value', async () => {
    const dto = {
      title: 'Timezone check',
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
      recurrenceType: RecurrenceType.WEEKLY,
      weeklyDay: [Weekday.MON],
      seriesTimezone: 'Mars/Phobos',
      tagIds: [],
    };

    seriesRepository.hasConflict.mockResolvedValue(false);
    tagRepository.allTagIdsExist.mockResolvedValue(true);

    await expect(
      service.createAppointmentSeries(userId, dto as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(seriesRepository.createSeries).not.toHaveBeenCalled();
    expect(appointmentQueue.add).not.toHaveBeenCalled();
  });
});
