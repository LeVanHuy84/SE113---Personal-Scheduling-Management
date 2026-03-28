import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { REMINDER_QUEUE_NAME } from './reminder.constants';
import { ReminderProcessor } from './reminder.processor';
import { ReminderQueueService } from './reminder-queue.service';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: REMINDER_QUEUE_NAME })],
  providers: [ReminderQueueService, ReminderProcessor],
  exports: [ReminderQueueService],
})
export class ReminderModule {}
