import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { ReminderModule } from '../reminder/reminder.module';
import { RecurringCron } from './recurring.cron';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, ReminderModule],
  providers: [RecurringCron],
})
export class RecurringModule {}
