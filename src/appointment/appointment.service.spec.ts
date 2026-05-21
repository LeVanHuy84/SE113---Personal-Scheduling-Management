import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let repository: {
    findAppointments: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };
  let reminderQueue: { remove: jest.Mock };

  beforeEach(() => {
    repository = {
      findAppointments: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    reminderQueue = {
      remove: jest.fn(),
    };

    service = new AppointmentService(
      reminderQueue as never,
      repository as never,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('RT-01 should retrieve appointments with default pagination for authenticated user', async () => {
    const query = {
      userId: '3f26c88e-6e66-4cbc-aa5e-5e3684f5b3d2',
      page: 1,
      limit: 10,
    };

    repository.findAppointments.mockResolvedValue({
      items: [{ id: 'a-1' }],
      total: 1,
      page: 1,
      limit: 10,
    });

    const result = await service.getAppointments(query as never);

    expect(repository.findAppointments).toHaveBeenCalledWith(query);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('RT-03 should pass pagination query page=2&limit=5 to repository', async () => {
    const query = {
      userId: '96d266e0-20eb-4dce-b20d-f95ec5f4fe57',
      page: 2,
      limit: 5,
    };

    repository.findAppointments.mockResolvedValue({
      items: [{ id: 'a-2' }],
      total: 12,
      page: 2,
      limit: 5,
    });

    const result = await service.getAppointments(query as never);

    expect(repository.findAppointments).toHaveBeenCalledWith(query);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('ST-01 should transition SCHEDULED to COMPLETED', async () => {
    repository.findById.mockResolvedValue({
      id: 'app-1',
      status: AppointmentStatus.SCHEDULED,
    });
    repository.update.mockResolvedValue({
      id: 'app-1',
      status: AppointmentStatus.COMPLETED,
      jobId: null,
    });

    await service.updateAppointmentStatus('app-1', AppointmentStatus.COMPLETED);

    expect(repository.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: { status: AppointmentStatus.COMPLETED },
    });
    expect(reminderQueue.remove).not.toHaveBeenCalled();
  });

  it('ST-02 should transition SCHEDULED to CANCELLED and remove reminder job when jobId exists', async () => {
    repository.findById.mockResolvedValue({
      id: 'app-2',
      status: AppointmentStatus.SCHEDULED,
    });
    repository.update.mockResolvedValue({
      id: 'app-2',
      status: AppointmentStatus.CANCELLED,
      jobId: 'job-123',
    });

    await service.updateAppointmentStatus('app-2', AppointmentStatus.CANCELLED);

    expect(repository.update).toHaveBeenCalledWith({
      where: { id: 'app-2' },
      data: { status: AppointmentStatus.CANCELLED },
    });
    expect(reminderQueue.remove).toHaveBeenCalledWith('job-123');
  });

  it('ST-03 should reject transition from COMPLETED terminal state', async () => {
    repository.findById.mockResolvedValue({
      id: 'app-3',
      status: AppointmentStatus.COMPLETED,
    });

    await expect(
      service.updateAppointmentStatus('app-3', AppointmentStatus.SCHEDULED),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('ST-04 should reject transition from CANCELLED terminal state', async () => {
    repository.findById.mockResolvedValue({
      id: 'app-4',
      status: AppointmentStatus.CANCELLED,
    });

    await expect(
      service.updateAppointmentStatus('app-4', AppointmentStatus.SCHEDULED),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('ST-07 should return not found when appointment does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updateAppointmentStatus('missing-id', AppointmentStatus.SCHEDULED),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('ST-08 should reject invalid target status value', async () => {
    repository.findById.mockResolvedValue({
      id: 'app-8',
      status: AppointmentStatus.SCHEDULED,
    });

    await expect(
      service.updateAppointmentStatus('app-8', 'INVALID_VALUE' as AppointmentStatus),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.update).not.toHaveBeenCalled();
  });
});
