import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RecurrenceType, Weekday } from '@prisma/client';
import { Queue } from 'bullmq';
import { AppointmentRepository } from 'src/appointment/appointment.repository';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { APPOINTMENT_QUEUE_NAME, AppointmentJobPayload, REMINDER_QUEUE_NAME, ReminderJobPayload } from 'src/queue/queue.constants';
import { TagRepository } from 'src/tag/tag.repository';
import { CreateAppointmentSeriesRequestDto } from './dto/create-series-request.dto';
import { AppointmentSeriesQueryDto } from './dto/get-series-query.dto';
import { AppointmentSeriesResponseDto } from './dto/series-response.dto';
import { UpdateAppointmentSeriesRequestDto } from './dto/update-series-request.dto';
import { AppointmentSeriesRepository } from './series.repository';


type ValidateRecurrenceInput = {
  recurrenceType?: RecurrenceType;

  weeklyDay?: Weekday[] | null;
  monthlyDay?: number | null;
  yearlyDay?: number | null;
  yearlyMonth?: number | null;
};

@Injectable()
export class AppointmentSeriesService {
  constructor(
    @InjectQueue(APPOINTMENT_QUEUE_NAME)
    private readonly appointmentQueue: Queue<AppointmentJobPayload>,

    @InjectQueue(REMINDER_QUEUE_NAME)
    private readonly reminderQueue: Queue<ReminderJobPayload>,

    private readonly seriesRepository: AppointmentSeriesRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly tagRepository: TagRepository
  ) { }

  // Appointment Series
  async createAppointmentSeries(
    userId: string,
    dto: CreateAppointmentSeriesRequestDto,
  ): Promise<{ id: string }> {
    if (dto.seriesTimezone && !this.isValidTimezone(dto.seriesTimezone)) {
      throw new BadRequestException('INVALID_TIMEZONE');
    }

    const isValid = this.isValidateRecurrence({
      recurrenceType: dto.recurrenceType,
      weeklyDay: dto.weeklyDay,
      monthlyDay: dto.monthlyDay,
      yearlyDay: dto.yearlyDay,

    });
    if (!isValid) {
      throw new BadRequestException('INVALID_RECURRENCE');
    }

    // check có appointment nào trung thời gian này không
    const hasConflict = await this.seriesRepository.hasConflict(
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

    const createdSeries = await this.seriesRepository.createSeries({
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


    await this.appointmentQueue.add(APPOINTMENT_QUEUE_NAME, { data: createdSeries }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 5
    })

    return createdSeries;
  }

  async getAppointmentSeries(
    query: AppointmentSeriesQueryDto,
  ): Promise<PaginationResponseDto<AppointmentSeriesResponseDto[]>> {


    const result = await this.seriesRepository.findSeries(query);
    return result;
  }

  async updateAppointmentSeries(
    userId: string,
    seriesId: string,
    dto: UpdateAppointmentSeriesRequestDto,
  ): Promise<{ id: string }> {
    if (dto.seriesTimezone && !this.isValidTimezone(dto.seriesTimezone)) {
      throw new BadRequestException('INVALID_TIMEZONE');
    }


    // check recurrence
    const isValid = this.isValidateRecurrence(
      {
        recurrenceType: dto.recurrenceType,
        weeklyDay: dto.weeklyDay,
        monthlyDay: dto.monthlyDay,
        yearlyDay: dto.yearlyDay,
      },
      true, // isUpdate — recurrenceType is optional on PATCH
    );
    if (!isValid) {
      throw new BadRequestException('INVALID_RECURRENCE');
    }

    // 🔹 2. Check time conflict nếu có startAt và endAt mới
    if (dto.startAt && dto.endAt) {
      const hasConflict =
        await this.seriesRepository.hasConflict(
          userId,
          dto.startAt,
          dto.endAt,
          seriesId
        );
      if (hasConflict) throw new ConflictException('Overlapping appointment');
    }

    // 🔹 3. Update series
    let updated;
    try {
      updated = await this.seriesRepository.updateSeries({
        id: seriesId,
        data: { ...dto },
      });

      // 🔹 4. Cleanup các future appointments nếu cần
      await this.cleanupFutureBySeries(userId, seriesId);
      await this.appointmentQueue.add(APPOINTMENT_QUEUE_NAME, { data: updated }, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 5
      })

      return updated;

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Appointment series with id ${seriesId} not found`,
          );
        }
      }
      throw new BadRequestException(error.message);
    }

  }

  async deleteAppointmentSeries(
    userId: string,
    seriesId: string,
  ) {
    try {
      await this.seriesRepository.deleteSeries({
        userId,
        seriesId,
      });
      await this.cleanupFutureBySeries(userId, seriesId);

      return { success: true, message: "Delete appointment series successfully!" };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Appointment series with id ${seriesId} not found`,
          );
        }
      }
      // Các lỗi khác
      throw new BadRequestException(error.message);
    }

  }

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

    if (isUpdate && !recurrenceType) {
      return true;
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

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return true;
    } catch {
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
    // await this.cancelReminderJobs(appointmentIds);
    // await this.appointmentRepository.deleteRemindersByAppointmentIds(appointmentIds);
    await this.appointmentRepository.deleteFutureAppointmentsBySeries({
      userId,
      seriesId,
      from: new Date(),
    });
  }

  // private async cancelReminderJobs(appointmentIds: string[]): Promise<void> {
  //   const jobIds = await this.appointmentRepository.findReminderIdsByAppointmentIds(
  //     appointmentIds,
  //   );
  //   if (jobIds.length === 0) {
  //     return;
  //   }

  //   await Promise.all(
  //     jobIds.map(async (jobId) => {
  //       if (jobId) {
  //         await this.reminderQueue.remove(jobId);
  //       }
  //     }),
  //   );
  // }
}

