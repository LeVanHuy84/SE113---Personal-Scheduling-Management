import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { GetAppointmentByIdParamsDto } from './dto/get-appointment-by-id-params.dto';
import { GetAppointmentsQueryDto } from './dto/get-appointments-query.dto';
import { AppointmentService } from './appointment.service';
import { UpdateAppointmentRequestDto } from './dto/update-appointment-request.dto';
import { DeleteAppointmentQueryDto } from './dto/delete-appointment-query.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateAppointmentRequestDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ): Promise<{ id: string }> {
    return this.appointmentService.createAppointment(user.userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAppointments(
    @Query() dto: GetAppointmentsQueryDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ) {
    return this.appointmentService.getAppointments(user.userId, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getAppointmentById(
    @Param() params: GetAppointmentByIdParamsDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.getAppointmentById(
      user.userId,
      params.id,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  updateAppointment(
    @Param() params: GetAppointmentByIdParamsDto,
    @Body() dto: UpdateAppointmentRequestDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.updateAppointment(
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
  ): Promise<{ success: boolean; deletedCount: number }> {
    return this.appointmentService.deleteAppointment(user.userId, params.id, query);
  }
}

