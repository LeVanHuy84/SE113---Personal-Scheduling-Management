import { Module } from '@nestjs/common';
import { EmailModule } from 'src/email/email.module';
import { ReminderProcessor } from 'src/queue/reminder.processor';
import { QueueModule } from 'src/queue/queue.module';
import { TagModule } from 'src/tag/tag.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    TagModule,
    QueueModule,
    EmailModule,
    NotificationModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentRepository, AppointmentService, ReminderProcessor],
  exports: [AppointmentRepository, AppointmentService],
})
export class AppointmentModule {}
