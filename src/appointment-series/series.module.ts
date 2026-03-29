import { Module } from '@nestjs/common';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { AppointmentProcessor } from 'src/queue/appointment.processor';
import { QueueModule } from 'src/queue/queue.module';
import { ReminderProcessor } from 'src/queue/reminder.processor';
import { TagModule } from 'src/tag/tag.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentSeriesController } from './series.controller';
import { AppointmentSeriesRepository } from './series.repository';
import { AppointmentSeriesService } from './series.service';


@Module({
  imports: [PrismaModule, TagModule, QueueModule, AppointmentModule],
  controllers: [AppointmentSeriesController],
  providers: [AppointmentSeriesRepository, AppointmentSeriesService, ReminderProcessor, AppointmentProcessor],
  exports: [AppointmentSeriesRepository, AppointmentSeriesService]
})
export class AppointmentSeriesModule { }
