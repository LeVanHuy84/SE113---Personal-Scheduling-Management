import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTeamInvitationRequestDto } from './dto/create-team-invitation-request.dto';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { GetTeamsQueryDto } from './dto/get-teams-query.dto';
import { LeaveTeamResponseDto } from './dto/leave-team-response.dto';
import { TeamDetailResponseDto } from './dto/team-detail-response.dto';
import { TeamIdParamsDto } from './dto/team-id-params.dto';
import { TeamInvitationResponseDto } from './dto/team-invitation-response.dto';
import { TeamListResponseDto } from './dto/team-list-response.dto';
import { TeamMemberListResponseDto } from './dto/team-member-list-response.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamService } from './team.service';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTeam(
    @CurrentUser() user: CurrentUserPrincipal,
    @Body() dto: CreateTeamRequestDto,
  ): Promise<TeamResponseDto> {
    return this.teamService.createTeam(user.userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getMyTeams(
    @CurrentUser() user: CurrentUserPrincipal,
    @Query() query: GetTeamsQueryDto,
  ): Promise<TeamListResponseDto> {
    return this.teamService.getMyTeams(user.userId, query);
  }

  @Get(':teamId')
  @HttpCode(HttpStatus.OK)
  getTeamDetail(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
  ): Promise<TeamDetailResponseDto> {
    return this.teamService.getTeamDetail(user.userId, params.teamId);
  }

  @Get(':teamId/members')
  @HttpCode(HttpStatus.OK)
  getTeamMembers(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
  ): Promise<TeamMemberListResponseDto> {
    return this.teamService.getMembers(user.userId, params.teamId);
  }

  @Post(':teamId/invitations')
  @HttpCode(HttpStatus.CREATED)
  inviteMember(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
    @Body() dto: CreateTeamInvitationRequestDto,
  ): Promise<TeamInvitationResponseDto> {
    return this.teamService.inviteMember(user.userId, params.teamId, dto);
  }

  @Post(':teamId/leave')
  @HttpCode(HttpStatus.OK)
  leaveTeam(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
  ): Promise<LeaveTeamResponseDto> {
    return this.teamService.leaveTeam(user.userId, params.teamId);
  }
}
