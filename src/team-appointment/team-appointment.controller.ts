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
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTeamAppointmentRequestDto } from './dto/create-team-appointment-request.dto';
import { DeleteTeamAppointmentResponseDto } from './dto/delete-team-appointment-response.dto';
import { GetTeamAppointmentsQueryDto } from './dto/get-team-appointments-query.dto';
import {
  TeamAppointmentListItemDto,
  TeamAppointmentListResponseDto,
} from './dto/team-appointment-list-response.dto';
import { TeamAppointmentIdParamsDto } from './dto/team-appointment-id-params.dto';
import { TeamAppointmentResponseDto } from './dto/team-appointment-response.dto';
import { TeamIdParamsDto } from './dto/team-id-params.dto';
import { UpdateTeamAppointmentRequestDto } from './dto/update-team-appointment-request.dto';
import { TeamAppointmentService } from './team-appointment.service';

@Controller('teams/:teamId/appointments')
@UseGuards(JwtAuthGuard)
export class TeamAppointmentController {
  constructor(
    private readonly teamAppointmentService: TeamAppointmentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTeamAppointment(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
    @Body() dto: CreateTeamAppointmentRequestDto,
  ): Promise<TeamAppointmentResponseDto> {
    return this.teamAppointmentService.createTeamAppointment(
      user.userId,
      params.teamId,
      dto,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  listTeamAppointments(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
    @Query() query: GetTeamAppointmentsQueryDto,
  ): Promise<PaginationResponseDto<TeamAppointmentListItemDto[]>> {
    return this.teamAppointmentService.listTeamAppointments(
      user.userId,
      params.teamId,
      query,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateTeamAppointment(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamAppointmentIdParamsDto,
    @Body() dto: UpdateTeamAppointmentRequestDto,
  ): Promise<TeamAppointmentResponseDto> {
    return this.teamAppointmentService.updateTeamAppointment(
      user.userId,
      params.teamId,
      params.id,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteTeamAppointment(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamAppointmentIdParamsDto,
  ): Promise<DeleteTeamAppointmentResponseDto> {
    return this.teamAppointmentService.deleteTeamAppointment(
      user.userId,
      params.teamId,
      params.id,
    );
  }
}
