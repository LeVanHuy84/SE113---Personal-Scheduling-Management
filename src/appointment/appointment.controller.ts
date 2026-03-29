import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentService } from './appointment.service';
import { AppointmentQueryDto } from './dto/get-appointments-query.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAppointmentSeries(
    @Query() query: AppointmentQueryDto,
  ) {
    return this.appointmentService.getAppointments(query);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateAppointmentStatus(
    @Param('id') id: string,
    @Body() dto: { status: AppointmentStatus },
  ) {

    return this.appointmentService.updateAppointmentStatus(
      id,
      dto.status,
    );
  }
}

