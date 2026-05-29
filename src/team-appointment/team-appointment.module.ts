import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { TeamAppointmentController } from './team-appointment.controller';
import { TeamAppointmentRepository } from './team-appointment.repository';
import { TeamAppointmentService } from './team-appointment.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [TeamAppointmentController],
  providers: [TeamAppointmentRepository, TeamAppointmentService],
  exports: [TeamAppointmentRepository],
})
export class TeamAppointmentModule {}
