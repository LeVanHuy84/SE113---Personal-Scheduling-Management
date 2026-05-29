import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APPOINTMENT_QUEUE_NAME, MISSED_APPOINTMENT_QUEUE_NAME, REMINDER_QUEUE_NAME } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: Number(configService.getOrThrow<string>('REDIS_PORT')),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
        prefix: configService.getOrThrow<string>('BULLMQ_PREFIX'),
      }),
    }),
    BullModule.registerQueue({ name: APPOINTMENT_QUEUE_NAME }),
    BullModule.registerQueue({ name: REMINDER_QUEUE_NAME }),
    BullModule.registerQueue({ name: MISSED_APPOINTMENT_QUEUE_NAME }),
  ],
  exports: [BullModule],
})
export class QueueModule { }
