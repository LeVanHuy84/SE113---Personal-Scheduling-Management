import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { REMINDER_QUEUE_NAME, ReminderJobPayload } from 'src/queue/queue.constants';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { AppointmentQueryDto } from './dto/get-appointments-query.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectQueue(REMINDER_QUEUE_NAME)
    private readonly reminderQueue: Queue<ReminderJobPayload>,

    private readonly appointmentRepository: AppointmentRepository,
  ) { }

  async getAppointments(
    query: AppointmentQueryDto,
  ): Promise<PaginationResponseDto<AppointmentResponseDto[]>> {
    const result = this.appointmentRepository.findAppointments(query);
    return result
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    if (!Object.values(AppointmentStatus).includes(status)) {
      throw new BadRequestException(`Invalid appointment status: ${status}`);
    }

    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }

    // Không được revert status đã hoàn thành, hủy hoặc missed
    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.MISSED
    ) {
      throw new BadRequestException(
        `Cannot update appointment from ${appointment.status}`
      );
    }


    const update = await this.appointmentRepository.update({
      where: {
        id,
      },
      data: {
        status
      }
    })

    if (status === "CANCELLED" && update.jobId) {

      await this.reminderQueue.remove(update.jobId);
    }
  }

}

