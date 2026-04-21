import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentController } from 'src/appointment/appointment.controller';
import { AppointmentModule } from 'src/appointment/appointment.module';
import { MissedAppointmentProcessor } from 'src/queue/appointment.processor';
import { QueueModule } from 'src/queue/queue.module';
import { ReminderProcessor } from 'src/queue/reminder.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { RecurringCron } from './recurring.cron';
import { EmailModule } from 'src/email/email.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, QueueModule, AppointmentModule, EmailModule, NotificationModule],
  providers: [RecurringCron, ReminderProcessor, MissedAppointmentProcessor, AppointmentController],
})
export class RecurringModule { }
