import { Module } from '@nestjs/common';
import { ReminderProcessor } from 'src/queue/reminder.processor';
import { TagModule } from 'src/tag/tag.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [PrismaModule, TagModule],
  controllers: [AppointmentController],
  providers: [AppointmentRepository, AppointmentService, ReminderProcessor],
  exports: [AppointmentRepository, AppointmentService]
})
export class AppointmentModule { }
