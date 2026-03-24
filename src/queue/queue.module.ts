import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

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
  ],
  exports: [BullModule],
})
export class QueueModule {}
