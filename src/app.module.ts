import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnvironment } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { CommonModule } from './common/common.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentModule } from './appointment/appointment.module';
import { RecurringModule } from './recurring/recurring.module';
import { NotificationModule } from './notification/notification.module';
import { StatisticsModule } from './statistics/statistics.module';
import { UserModule } from './user/user.module';
import { TagModule } from './tag/tag.module';
import { AppointmentSeriesModule } from './appointment-series/series.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
      validate: validateEnvironment,
    }),
    CommonModule,
    PrismaModule,
    FirebaseModule,
    NotificationModule,
    QueueModule,
    AuthModule,
    AppointmentSeriesModule,
    RecurringModule,
    NotificationModule,
    StatisticsModule,
    AppointmentModule,
    TagModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
