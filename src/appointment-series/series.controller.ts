import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAppointmentSeriesRequestDto } from './dto/create-series-request.dto';
import { GetAppointmentByIdParamsDto } from './dto/get-appointment-by-id-params.dto';
import { AppointmentSeriesQueryDto } from './dto/get-series-query.dto';
import { UpdateAppointmentSeriesRequestDto } from './dto/update-series-request.dto';
import { AppointmentSeriesService } from './series.service';

@Controller('series')
@UseGuards(JwtAuthGuard)
export class AppointmentSeriesController {
  constructor(private readonly seriesService: AppointmentSeriesService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateAppointmentSeriesRequestDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ): Promise<{ id: string }> {
    return this.seriesService.createAppointmentSeries(user.userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAppointmentSeries(
    @Query() query: AppointmentSeriesQueryDto,
  ) {
    return this.seriesService.getAppointmentSeries(query);
  }


  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateAppointmentSeries(
    @Param() params: GetAppointmentByIdParamsDto,
    @Body() dto: UpdateAppointmentSeriesRequestDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ) {

    return this.seriesService.updateAppointmentSeries(
      user.userId,
      params.id,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteAppointmentSeries(
    @Param() params: GetAppointmentByIdParamsDto,
    @CurrentUser() user: CurrentUserPrincipal,
  ) {
    return this.seriesService.deleteAppointmentSeries(user.userId, params.id);
  }
}

