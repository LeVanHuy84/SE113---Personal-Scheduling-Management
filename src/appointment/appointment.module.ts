import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReminderModule } from '../reminder/reminder.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';
import { TagModule } from 'src/tag/tag.module';

@Module({
  imports: [PrismaModule, ReminderModule, TagModule],
  controllers: [AppointmentController],
  providers: [AppointmentRepository, AppointmentService],
})
export class AppointmentModule {}
