import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { GetAppointmentsQueryDto } from './dto/get-appointments-query.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';
import { DeleteAppointmentQueryDto } from './dto/delete-appointment-query.dto';
import { UpdateAppointmentRequestDto } from './dto/update-appointment-request.dto';
import {
  AppointmentRepository,
  type AppointmentSelectResult,
} from './appointment.repository';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async createAppointment(
    userId: string,
    dto: CreateAppointmentRequestDto,
  ): Promise<{ id: string }> {
    const hasConflict =
      await this.appointmentRepository.hasOverlappingScheduledAppointment(
        userId,
        dto.startTime,
        dto.endTime,
      );

    if (hasConflict) {
      throw new ConflictException('Overlapping appointment');
    }

    const created = await this.appointmentRepository.createAppointment({
      userId,
      title: dto.title,
      description: dto.description,
      startsAt: dto.startTime,
      endsAt: dto.endTime,
      isAllDay: dto.isAllDay ?? false,
    });

    return { id: created.id };
  }

  async getAppointments(
    userId: string,
    query: GetAppointmentsQueryDto,
  ): Promise<{
    items: AppointmentResponseDto[];
    page: number;
    limit: number;
    total: number;
  }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.appointmentRepository.findAppointmentsForUser({
        userId,
        skip,
        take: limit,
      }),
      this.appointmentRepository.countAppointmentsForUser(userId),
    ]);

    return {
      items: items.map((a) => this.toAppointmentResponseDto(a)),
      page,
      limit,
      total,
    };
  }

  async getAppointmentById(
    userId: string,
    id: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findAppointmentByIdForUser(
      { userId, id },
    );

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.toAppointmentResponseDto(appointment);
  }

  async updateAppointment(
    userId: string,
    id: string,
    dto: UpdateAppointmentRequestDto,
  ): Promise<AppointmentResponseDto> {
    const existing = await this.appointmentRepository.findAppointmentByIdForUser({
      userId,
      id,
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    if (existing.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be updated');
    }

    if (dto.scope && dto.scope !== 'single') {
      throw new BadRequestException('Invalid scope');
    }

    const nextStartsAt = dto.startTime ?? existing.startsAt;
    const nextEndsAt = dto.endTime ?? existing.endsAt;

    if (dto.startTime || dto.endTime) {
      if (!(nextStartsAt instanceof Date) || isNaN(nextStartsAt.getTime())) {
        throw new BadRequestException('Invalid startTime');
      }
      if (!(nextEndsAt instanceof Date) || isNaN(nextEndsAt.getTime())) {
        throw new BadRequestException('Invalid endTime');
      }
      if (nextStartsAt.getTime() < Date.now()) {
        throw new BadRequestException('startTime must not be in the past');
      }
      if (nextStartsAt.getTime() >= nextEndsAt.getTime()) {
        throw new BadRequestException('startTime must be before endTime');
      }
    }

    const hasConflict =
      await this.appointmentRepository.hasOverlappingScheduledAppointmentExcludingId(
        {
          userId,
          startsAt: nextStartsAt,
          endsAt: nextEndsAt,
          excludeId: existing.id,
        },
      );

    if (hasConflict) {
      throw new ConflictException('Overlapping appointment');
    }

    const updated = await this.appointmentRepository.updateAppointmentByIdForUser({
      userId,
      id,
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.startTime !== undefined ? { startsAt: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endsAt: dto.endTime } : {}),
        ...(dto.isAllDay !== undefined ? { isAllDay: dto.isAllDay } : {}),
      },
    });

    if (!updated) {
      throw new NotFoundException('Appointment not found');
    }

    return this.toAppointmentResponseDto(updated);
  }

  async deleteAppointment(
    userId: string,
    id: string,
    query: DeleteAppointmentQueryDto,
  ): Promise<{ success: boolean; deletedCount: number }> {
    if (query.scope && query.scope !== 'single') {
      throw new BadRequestException('Invalid scope');
    }

    const deletedCount =
      await this.appointmentRepository.softDeleteAppointmentByIdForUser({
        userId,
        id,
      });

    if (deletedCount === 0) {
      throw new NotFoundException('Appointment not found');
    }

    return { success: true, deletedCount };
  }

  private toAppointmentResponseDto(
    appointment: AppointmentSelectResult,
  ): AppointmentResponseDto {
    return {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      startTime: appointment.startsAt,
      endTime: appointment.endsAt,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}

