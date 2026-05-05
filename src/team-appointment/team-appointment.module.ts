import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamAppointmentController } from './team-appointment.controller';
import { TeamAppointmentRepository } from './team-appointment.repository';
import { TeamAppointmentService } from './team-appointment.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamAppointmentController],
  providers: [TeamAppointmentRepository, TeamAppointmentService],
})
export class TeamAppointmentModule {}
