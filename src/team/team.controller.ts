import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangeMemberRoleRequestDto } from './dto/change-member-role-request.dto';
import { CreateTeamInvitationRequestDto } from './dto/create-team-invitation-request.dto';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { GetTeamsQueryDto } from './dto/get-teams-query.dto';
import { InvitationActionResponseDto } from './dto/invitation-action-response.dto';
import { LeaveTeamResponseDto } from './dto/leave-team-response.dto';
import { TeamDetailResponseDto } from './dto/team-detail-response.dto';
import { TeamIdParamsDto } from './dto/team-id-params.dto';
import { TeamInvitationActionParamsDto } from './dto/team-invitation-action-params.dto';
import { TeamInvitationResponseDto } from './dto/team-invitation-response.dto';
import { TeamListResponseDto } from './dto/team-list-response.dto';
import { TeamMemberListResponseDto } from './dto/team-member-list-response.dto';
import { TeamMemberRoleResponseDto } from './dto/team-member-role-response.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamService } from './team.service';
import { GetMyInvitationsQueryDto } from './dto/get-my-invitations-query.dto';
import { TeamMyInvitationItemDto } from './dto/team-my-invitation-response.dto';
import { GetTeamMembersQueryDto } from './dto/get-team-members-query.dto';
import { UpdateTeamRequestDto } from './dto/update-team-request.dto';
import { RemoveTeamMemberResponseDto } from './dto/remove-team-member-response.dto';

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

  @Get('invitations/me')
  @HttpCode(HttpStatus.OK)
  getMyInvitations(
    @CurrentUser() user: CurrentUserPrincipal,
    @Query() query: GetMyInvitationsQueryDto,
  ): Promise<TeamMyInvitationItemDto[]> {
    return this.teamService.getMyInvitations(user.userId, query);
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
    @Query() query: GetTeamMembersQueryDto,
  ): Promise<TeamMemberListResponseDto> {
    return this.teamService.getMembers(user.userId, params.teamId, query);
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

  @Post(':teamId/invitations/:invitationId/accept')
  @HttpCode(HttpStatus.OK)
  acceptInvitation(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamInvitationActionParamsDto,
  ): Promise<InvitationActionResponseDto> {
    return this.teamService.acceptInvitation(
      user.userId,
      params.teamId,
      params.invitationId,
    );
  }

  @Post(':teamId/invitations/:invitationId/decline')
  @HttpCode(HttpStatus.OK)
  declineInvitation(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamInvitationActionParamsDto,
  ): Promise<InvitationActionResponseDto> {
    return this.teamService.declineInvitation(
      user.userId,
      params.teamId,
      params.invitationId,
    );
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.OK)
  deleteTeam(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param('teamId') teamId: string,
  ): Promise<{ message: string; data: null }> {
    return this.teamService.deleteTeam(user.userId, teamId);
  }

  @Patch(':teamId/members/:userId/role')
  @HttpCode(HttpStatus.OK)
  changeMemberRole(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param('teamId') teamId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: ChangeMemberRoleRequestDto,
  ): Promise<TeamMemberRoleResponseDto> {
    return this.teamService.changeMemberRole(
      user.userId,
      teamId,
      targetUserId,
      dto,
    );
  }

  @Post(':teamId/leave')
  @HttpCode(HttpStatus.OK)
  leaveTeam(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
  ): Promise<LeaveTeamResponseDto> {
    return this.teamService.leaveTeam(user.userId, params.teamId);
  }

  @Patch(':teamId')
  @HttpCode(HttpStatus.OK)
  updateTeam(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TeamIdParamsDto,
    @Body() dto: UpdateTeamRequestDto,
  ): Promise<TeamResponseDto> {
    return this.teamService.updateTeam(user.userId, params.teamId, dto);
  }

  @Delete(':teamId/members/:userId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param('teamId') teamId: string,
    @Param('userId') targetUserId: string,
  ): Promise<RemoveTeamMemberResponseDto> {
    return this.teamService.removeMember(user.userId, teamId, targetUserId);
  }
}
