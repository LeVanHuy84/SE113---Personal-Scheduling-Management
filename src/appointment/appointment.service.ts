import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecurrenceType, Weekday } from '@prisma/client';
import { ReminderQueueService } from '../reminder/reminder-queue.service';
import { AppointmentSeriesQueryDto } from './dto/get-appointments-query.dto';
import { AppointmentSeriesResponseDto } from './dto/appointment-response.dto';
import { CreateAppointmentSeriesRequestDto } from './dto/create-appointment-request.dto';
import { DeleteAppointmentQueryDto } from './dto/delete-appointment-query.dto';
import { UpdateAppointmentSeriesRequestDto } from './dto/update-appointment-request.dto';
import {
  AppointmentRepository,
} from './appointment.repository';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { TagRepository } from 'src/tag/tag.repository';

type ValidateRecurrenceInput = {
  recurrenceType?: RecurrenceType;

  weeklyDay?: Weekday[] | null;
  monthlyDay?: number | null;
  yearlyDay?: number | null;
  yearlyMonth?: number | null;
};

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly reminderQueueService: ReminderQueueService,
    private readonly tagRepository: TagRepository
  ) { }

  async createAppointment(
    userId: string,
    dto: CreateAppointmentSeriesRequestDto,
  ): Promise<{ id: string }> {
    // this.validateTimeRange(dto.startAt, dto.endAt);
    // const isValid = this.isValidateRecurrence({
    //   recurrenceType: dto.recurrenceType,
    //   weeklyDay: dto.weeklyDay,
    //   monthlyDay: dto.monthlyDay,
    //   yearlyDay: dto.yearlyDay,

    // });
    // if (!isValid) {
    //   throw new BadRequestException('INVALID_RECURRENCE');
    // }

    // check có appointment nào trung thời gian này không
    const hasConflict = await this.appointmentRepository.hasOverlappingScheduledAppointment(
      userId,
      dto.startAt,
      dto.endAt,
    );
    if (hasConflict) throw new ConflictException('Overlapping appointment');

    // allTagIdsExist trả về true nếu tất cả tagIds tồn tại
    const hasAllTagIdsExist = await this.tagRepository.allTagIdsExist(dto.tagIds);
    if (!hasAllTagIdsExist) {
      throw new BadRequestException('One or more tagIds do not exist in DB',
      );
    }

    const createdSeries = await this.appointmentRepository.createSeries({
      userId,
      title: dto.title,
      description: dto.description ?? null,
      recurrenceType: dto.recurrenceType as RecurrenceType,
      weeklyDay: dto.weeklyDay,
      monthlyDay: dto.monthlyDay,
      yearlyDay: dto.yearlyDay,
      yearlyMonth: dto.yearlyMonth,
      seriesTimezone: dto.seriesTimezone ?? 'UTC',
      startAt: dto.startAt,
      endAt: dto.endAt,
      tagIds: dto.tagIds ?? [],
    });

    return createdSeries;
  }

  async getAppointments(
    query: AppointmentSeriesQueryDto,
  ): Promise<PaginationResponseDto<AppointmentSeriesResponseDto[]>> {


    const result = this.appointmentRepository.findAppointmentsSeries(query);

    return result
  }


  async updateAppointmentSeries(
    userId: string,
    seriesId: string,
    dto: UpdateAppointmentSeriesRequestDto,
  ): Promise<{ id: string }> {
    console.log(userId, dto, seriesId);

    const series = await this.appointmentRepository.findAppointmentSeriesByIdForUser({
      userId,
      seriesId,
    });

    if (!series) throw new NotFoundException('Appointment series not found');

    // check recurrence
    const isValid = this.isValidateRecurrence({
      recurrenceType: dto.recurrenceType,
      weeklyDay: dto.weeklyDay,
      monthlyDay: dto.monthlyDay,
      yearlyDay: dto.yearlyDay,

    });
    if (!isValid) {
      throw new BadRequestException('INVALID_RECURRENCE');
    }

    if (dto.startAt && dto.endAt) {
      // this.validateTimeRange(dto.startAt, dto.endAt);
      const hasConflict =
        await this.appointmentRepository.hasOverlappingScheduledAppointment(
          userId,
          dto.startAt,
          dto.endAt,
        );
      if (hasConflict) throw new ConflictException('Overlapping appointment');
    }



    const updated = await this.appointmentRepository.updateSeriesByIdForUser({
      userId,
      seriesId,
      data: {
        // ...(dto.title !== undefined ? { title: dto.title } : {}),
        // ...(dto.description !== undefined ? { description: dto.description } : {}),
        // ...(dto.recurrenceFreq !== undefined
        //   ? { recurrenceFreq: dto.recurrenceFreq as RecurrenceFrequency }
        //   : {}),
        // ...(dto.recurrenceInterval !== undefined
        //   ? { recurrenceInterval: dto.recurrenceInterval }
        //   : {}),
        // ...(dto.recurrenceByDay !== undefined
        //   ? { recurrenceByDay: dto.recurrenceByDay }
        //   : {}),
        // ...(dto.recurrenceDayOfMonth !== undefined
        //   ? { recurrenceDayOfMonth: dto.recurrenceDayOfMonth }
        //   : {}),
        // ...(dto.seriesTimezone !== undefined
        //   ? { seriesTimezone: dto.seriesTimezone }
        //   : {}),

        ...dto,
      },
    });

    if (!updated) throw new NotFoundException('Appointment series not found');

    await this.cleanupFutureBySeries(userId, seriesId);
    return updated;
  }

  async deleteAppointment(
    userId: string,
    seriesId: string,
    query: DeleteAppointmentQueryDto,
  ) {
    if (query.scope && query.scope !== 'series')
      throw new BadRequestException('Invalid scope');

    const existing = await this.appointmentRepository.findAppointmentSeriesByIdForUser({
      userId,
      seriesId,
    });
    if (!existing) throw new NotFoundException('Appointment series not found');

    await this.appointmentRepository.deleteSeriesByIdForUser({
      userId,
      seriesId,
    });

    await this.cleanupFutureBySeries(userId, seriesId);

    return { message: "Delete appointment series successfully!" };
  }

  // private validateTimeRange(startTime: Date, endTime: Date): void {
  //   if (startTime.getTime() >= endTime.getTime()) {
  //     throw new BadRequestException('startTime must be before endTime');
  //   }
  //   if (startTime.getTime() < Date.now()) {
  //     throw new BadRequestException('startTime must not be in the past');
  //   }
  // }

  private isValidateRecurrence(
    input: ValidateRecurrenceInput,
    isUpdate = false,
  ): boolean {
    const {
      recurrenceType,
      weeklyDay,
      monthlyDay,
      yearlyDay,
      yearlyMonth,
    } = input;

    if (!isUpdate && !recurrenceType) {
      return false;
    }

    if (
      recurrenceType &&
      !Object.values(RecurrenceType).includes(recurrenceType)
    ) {
      return false;
    }

    switch (recurrenceType) {
      case 'ONETIME':
        return (
          (!weeklyDay || weeklyDay.length === 0) &&
          monthlyDay == null &&
          yearlyDay == null &&
          yearlyMonth == null
        );

      case 'DAILY':
        return (
          (!weeklyDay || weeklyDay.length === 0) &&
          monthlyDay == null &&
          yearlyDay == null &&
          yearlyMonth == null
        );

      case 'WEEKLY':
        return !!weeklyDay && weeklyDay.length > 0;

      case 'MONTHLY':
        return (
          typeof monthlyDay === 'number' &&
          monthlyDay >= 1 &&
          monthlyDay <= 31
        );

      case 'YEARLY':
        return (
          typeof yearlyDay === 'number' &&
          yearlyDay >= 1 &&
          yearlyDay <= 31 &&
          typeof yearlyMonth === 'number' &&
          yearlyMonth >= 1 &&
          yearlyMonth <= 12
        );

      default:
        return false;
    }
  }

  private async cleanupFutureBySeries(
    userId: string,
    seriesId: string,
  ): Promise<void> {
    const futureAppointments =
      await this.appointmentRepository.findFutureAppointmentsBySeries({
        userId,
        seriesId,
        from: new Date(),
      });

    const appointmentIds = futureAppointments.map((a) => a.id);
    await this.cancelReminderJobs(appointmentIds);
    await this.appointmentRepository.deleteRemindersByAppointmentIds(appointmentIds);
    await this.appointmentRepository.deleteFutureAppointmentsBySeries({
      userId,
      seriesId,
      from: new Date(),
    });
  }

  private async cancelReminderJobs(appointmentIds: string[]): Promise<void> {
    const jobIds = await this.appointmentRepository.findReminderIdsByAppointmentIds(
      appointmentIds,
    );
    await this.reminderQueueService.cancelJobs(jobIds);
  }
}

