import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentSeriesModule } from './appointment-series/series.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { validateEnvironment } from './config/env.validation';
import { UserDeviceModule } from './device/user-device.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RecurringModule } from './recurring/recurring.module';
import { StatisticsModule } from './statistics/statistics.module';
import { UserModule } from './user/user.module';
import { TagModule } from './tag/tag.module';
import { TeamModule } from './team/team.module';
import { TeamAppointmentModule } from './team-appointment/team-appointment.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    UserDeviceModule,
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
    TeamModule,
    TeamAppointmentModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
