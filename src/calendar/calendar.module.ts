import { Module } from '@nestjs/common';
import { AppointmentModule } from '../appointment/appointment.module';
import { TeamAppointmentModule } from '../team-appointment/team-appointment.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AppointmentModule, TeamAppointmentModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
