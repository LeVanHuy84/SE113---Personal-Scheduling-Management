import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentController],
  providers: [AppointmentRepository, AppointmentService],
})
export class AppointmentModule {}
