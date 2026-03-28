import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAppointmentSeriesRequestDto } from './dto/create-appointment-request.dto';
import { GetAppointmentByIdParamsDto } from './dto/get-appointment-by-id-params.dto';
import { AppointmentSeriesQueryDto } from './dto/get-appointments-query.dto';
import { AppointmentService } from './appointment.service';
import { UpdateAppointmentSeriesRequestDto } from './dto/update-appointment-request.dto';
import { DeleteAppointmentQueryDto } from './dto/delete-appointment-query.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateAppointmentSeriesRequestDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ): Promise<{ id: string }> {
    return this.appointmentService.createAppointment(user.userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAppointmentSeries(
    @Query() query: AppointmentSeriesQueryDto,
  ) {
    return this.appointmentService.getAppointments(query);
  }


  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateAppointmentSeries(
    @Param() params: GetAppointmentByIdParamsDto,
    @Body() dto: UpdateAppointmentSeriesRequestDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ): Promise<{ id: string }> {

    return this.appointmentService.updateAppointmentSeries(
      user.userId,
      params.id,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteAppointment(
    @Param() params: GetAppointmentByIdParamsDto,
    @Query() query: DeleteAppointmentQueryDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ) {
    return this.appointmentService.deleteAppointment(user.userId, params.id, query);
  }
}

