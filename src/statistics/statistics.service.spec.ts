import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsRepository } from './statistics.repository';
import { GetStatisticsQueryDto, GroupByEnum } from './dto';
import { AppointmentStatus } from '@prisma/client';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let statisticsRepository: {
    findAppointmentsByDateRange: jest.Mock;
    findMonthlyStat: jest.Mock;
  };

  const userId = 'test-user-id';
  const otherUserId = 'other-user-id';
  const userTimezone = 'America/New_York';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: StatisticsRepository,
          useValue: {
            findAppointmentsByDateRange: jest.fn(),
            findMonthlyStat: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    statisticsRepository = module.get(StatisticsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatistics', () => {
    describe('✔ Normal calculation', () => {
      it('should calculate statistics correctly with mixed appointment statuses', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-10T14:00:00Z'),
            endAt: new Date('2026-03-10T15:00:00Z'),
            status: AppointmentStatus.SCHEDULED,
          },
          {
            id: '3',
            startAt: new Date('2026-03-15T10:30:00Z'),
            endAt: new Date('2026-03-15T11:30:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '4',
            startAt: new Date('2026-03-20T09:00:00Z'),
            endAt: new Date('2026-03-20T10:00:00Z'),
            status: AppointmentStatus.CANCELLED,
          },
          {
            id: '5',
            startAt: new Date('2026-03-25T16:00:00Z'),
            endAt: new Date('2026-03-25T17:00:00Z'),
            status: AppointmentStatus.MISSED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
          groupBy: GroupByEnum.DAY,
          timezone: 'UTC',
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.totalAppointments).toBe(5);
        expect(result.completedAppointments).toBe(2);
        expect(result.completionRate).toBe(0.4);
        expect(result.trend).toBeDefined();
        expect(result.trend.length).toBeGreaterThan(0);
      });

      it('should group appointments correctly by day', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-05T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-01T10:00:00Z'),
            endAt: new Date('2026-03-01T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-01T14:00:00Z'),
            endAt: new Date('2026-03-01T15:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '3',
            startAt: new Date('2026-03-03T10:00:00Z'),
            endAt: new Date('2026-03-03T11:00:00Z'),
            status: AppointmentStatus.SCHEDULED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
          groupBy: GroupByEnum.DAY,
          timezone: 'UTC',
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.trend.length).toBe(2); // 2 distinct days
        expect(result.trend[0].bucket).toBe('2026-03-01');
        expect(result.trend[0].total).toBe(2);
        expect(result.trend[0].completed).toBe(2);
        expect(result.trend[1].bucket).toBe('2026-03-03');
        expect(result.trend[1].total).toBe(1);
        expect(result.trend[1].completed).toBe(0);
      });

      it('should group appointments correctly by week', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-02T10:00:00Z'), // Monday week 1
            endAt: new Date('2026-03-02T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-09T10:00:00Z'), // Monday week 2
            endAt: new Date('2026-03-09T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
          groupBy: GroupByEnum.WEEK,
          timezone: 'UTC',
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.trend.length).toBe(2); // 2 distinct weeks
        expect(result.trend[0].completed).toBe(1);
        expect(result.trend[1].completed).toBe(1);
      });
    });

    describe('✔ Zero appointments', () => {
      it('should return zero metrics when no appointments found', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue([]);
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.totalAppointments).toBe(0);
        expect(result.completedAppointments).toBe(0);
        expect(result.completionRate).toBe(0);
        expect(result.mostProductiveSlot).toBeNull();
        expect(result.trend.length).toBe(0);
      });
    });

    describe('✔ completionRate = 0 when total = 0', () => {
      it('should return 0 completion rate when total appointments is zero', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue([]);
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.completionRate).toBe(0);
        expect(typeof result.completionRate).toBe('number');
      });

      it('should return 0 completion rate when all appointments are not completed', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.SCHEDULED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-10T14:00:00Z'),
            endAt: new Date('2026-03-10T15:00:00Z'),
            status: AppointmentStatus.CANCELLED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.totalAppointments).toBe(2);
        expect(result.completedAppointments).toBe(0);
        expect(result.completionRate).toBe(0);
      });
    });

    describe('✔ topSlot correct calculation', () => {
      it('should calculate most productive slot correctly', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        // 3 appointments at 10:00, 1 at 14:00, 1 at 09:00 (all completed)
        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-10T10:30:00Z'),
            endAt: new Date('2026-03-10T11:30:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '3',
            startAt: new Date('2026-03-15T10:45:00Z'),
            endAt: new Date('2026-03-15T11:45:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '4',
            startAt: new Date('2026-03-20T14:00:00Z'),
            endAt: new Date('2026-03-20T15:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '5',
            startAt: new Date('2026-03-25T09:00:00Z'),
            endAt: new Date('2026-03-25T10:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
          timezone: 'UTC',
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.mostProductiveSlot).toBe('10'); // 10:00 is most frequent
      });

      it('should return null when no completed appointments', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.SCHEDULED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-10T14:00:00Z'),
            endAt: new Date('2026-03-10T15:00:00Z'),
            status: AppointmentStatus.CANCELLED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.mostProductiveSlot).toBeNull();
      });

      it('should respect timezone when calculating slot', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        // Appointments at UTC times that map to different hours in NY timezone
        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T14:00:00Z'), // 09:00 AM EST
            endAt: new Date('2026-03-05T15:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-10T14:30:00Z'), // 09:30 AM EST
            endAt: new Date('2026-03-10T15:30:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
          timezone: 'America/New_York',
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        // Both map to hour 09 in NY timezone
        expect(result.mostProductiveSlot).toBe('09');
      });
    });

    describe('✔ Timezone handling', () => {
      it('should use provided timezone for calculations', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T18:00:00Z'), // 13:00 CDT (UTC-5)
            endAt: new Date('2026-03-05T19:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
          timezone: 'America/Chicago',
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.mostProductiveSlot).toBe('12'); // 12:00 in Chicago timezone
      });

      it('should default to UTC timezone if not provided', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        expect(result.mostProductiveSlot).toBe('10');
      });
    });

    describe('✔ User isolation (cannot access others)', () => {
      it('should only return appointments for the requesting user', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        await service.getStatistics(userId, userTimezone, query);

        expect(
          statisticsRepository.findAppointmentsByDateRange,
        ).toHaveBeenCalledWith(userId, expect.any(Date), expect.any(Date));
      });

      it('should use different userId for different requests', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue([]);
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        await service.getStatistics(userId, userTimezone, query);

        const firstCallUserId = (
          statisticsRepository.findAppointmentsByDateRange as jest.Mock
        ).mock.calls[0][0];

        jest.clearAllMocks();
        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue([]);
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        await service.getStatistics(otherUserId, userTimezone, query);

        const secondCallUserId = (
          statisticsRepository.findAppointmentsByDateRange as jest.Mock
        ).mock.calls[0][0];

        expect(firstCallUserId).not.toBe(secondCallUserId);
      });
    });

    describe('✔ Input validation', () => {
      it('should throw BadRequestException for invalid date format', async () => {
        const query: any = {
          startDate: 'not-a-date',
          endDate: '2026-03-31T23:59:59Z',
        };

        await expect(
          service.getStatistics(userId, userTimezone, query),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when startDate is after endDate', async () => {
        const query: GetStatisticsQueryDto = {
          startDate: '2026-03-31T23:59:59Z',
          endDate: '2026-03-01T00:00:00Z',
        };

        await expect(
          service.getStatistics(userId, userTimezone, query),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('✔ Completion rate precision', () => {
      it('should round completion rate to 2 decimal places', async () => {
        const startDate = '2026-03-01T00:00:00Z';
        const endDate = '2026-03-31T23:59:59Z';

        const mockAppointments = [
          {
            id: '1',
            startAt: new Date('2026-03-05T10:00:00Z'),
            endAt: new Date('2026-03-05T11:00:00Z'),
            status: AppointmentStatus.COMPLETED,
          },
          {
            id: '2',
            startAt: new Date('2026-03-10T14:00:00Z'),
            endAt: new Date('2026-03-10T15:00:00Z'),
            status: AppointmentStatus.SCHEDULED,
          },
          {
            id: '3',
            startAt: new Date('2026-03-15T09:00:00Z'),
            endAt: new Date('2026-03-15T10:00:00Z'),
            status: AppointmentStatus.SCHEDULED,
          },
        ];

        statisticsRepository.findAppointmentsByDateRange.mockResolvedValue(
          mockAppointments,
        );
        statisticsRepository.findMonthlyStat.mockResolvedValue(null);

        const query: GetStatisticsQueryDto = {
          startDate,
          endDate,
        };

        const result = await service.getStatistics(userId, userTimezone, query);

        // 1/3 = 0.333... should round to 0.33
        expect(result.completionRate).toBe(0.33);
      });
    });
  });
});
