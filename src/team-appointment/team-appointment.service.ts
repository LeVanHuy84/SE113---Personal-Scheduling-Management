import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, ParticipationType, TeamRole } from '@prisma/client';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { CreateTeamAppointmentRequestDto } from './dto/create-team-appointment-request.dto';
import { DeleteTeamAppointmentResponseDto } from './dto/delete-team-appointment-response.dto';
import { GetTeamAppointmentsQueryDto } from './dto/get-team-appointments-query.dto';
import {
  TeamAppointmentListItemDto,
  TeamAppointmentListResponseDto,
} from './dto/team-appointment-list-response.dto';
import { TeamAppointmentResponseDto } from './dto/team-appointment-response.dto';
import { UpdateTeamAppointmentRequestDto } from './dto/update-team-appointment-request.dto';
import { TeamAppointmentRepository } from './team-appointment.repository';

type ConflictWith = 'PERSONAL_APPOINTMENT' | 'TEAM_APPOINTMENT';

type SchedulingConflictItem = {
  userId: string;
  conflictWith: ConflictWith;
  startAt: Date;
  endAt: Date;
};
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TeamAppointmentService {
  constructor(
    private readonly teamAppointmentRepository: TeamAppointmentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async createTeamAppointment(
    userId: string,
    teamId: string,
    dto: CreateTeamAppointmentRequestDto,
  ): Promise<TeamAppointmentResponseDto> {
    const team = await this.teamAppointmentRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const myRole = await this.getActiveRole(teamId, userId, team.ownerId);
    if (myRole !== TeamRole.OWNER && myRole !== TeamRole.ADMIN) {
      throw new ForbiddenException(
        'Only OWNER or ADMIN can create team appointments',
      );
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.assertValidTimeRange(startAt, endAt);

    const requiredParticipantUserIds = this.normalizeRequiredParticipants(
      dto.participantUserIds,
    );

    await this.assertParticipantsAreActiveMembers(
      teamId,
      requiredParticipantUserIds,
    );

    const conflicts = await this.findRequiredParticipantConflicts({
      requiredParticipantUserIds,
      startAt,
      endAt,
    });

    if (conflicts.length) {
      throw new ConflictException({
        message: 'Scheduling conflict',
        conflicts,
      });
    }

    const created = await this.teamAppointmentRepository.createTeamAppointment({
      teamId,
      organizerId: userId,
      title: dto.title.trim(),
      description: dto.description ?? null,
      location: dto.location ?? null,
      startAt,
      endAt,
      participantUserIds: requiredParticipantUserIds,
    });

    // Send notifications to all participants
    const uniqueParticipantIds = Array.from(
      new Set(created.participants.map((p) => p.userId)),
    );
    for (const participantId of uniqueParticipantIds) {
      await this.notificationService.sendAndCreateNotification({
        appointment: {
          id: created.id,
          userId: participantId,
          startAt: created.startAt,
        },
        title: 'New Team Appointment',
        body: `New meeting: ${created.title}`,
        type: 'REMINDER',
        data: {
          teamId: created.teamId,
        },
      });
    }

    return this.toResponseDto(created);
  }

  async listTeamAppointments(
    userId: string,
    teamId: string,
    query: GetTeamAppointmentsQueryDto,
  ): Promise<PaginationResponseDto<TeamAppointmentListItemDto[]>> {
    const team = await this.teamAppointmentRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    await this.assertActiveMember(teamId, userId, team.ownerId);

    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;

    if (!from || !to) {
      throw new BadRequestException('from and to are required');
    }

    if (from.getTime() >= to.getTime()) {
      throw new BadRequestException('from must be before to');
    }

    const result = await this.teamAppointmentRepository.findTeamAppointments({
      teamId,
      from,
      to,
      page: query.page,
      limit: query.limit,
    });

    const response: TeamAppointmentListResponseDto = {
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    };

    return response;
  }

  async updateTeamAppointment(
    userId: string,
    teamId: string,
    appointmentId: string,
    dto: UpdateTeamAppointmentRequestDto,
  ): Promise<TeamAppointmentResponseDto> {
    const team = await this.teamAppointmentRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const existing =
      await this.teamAppointmentRepository.findTeamAppointmentById({
        teamId,
        appointmentId,
      });
    if (!existing) {
      throw new NotFoundException(
        `Team appointment with id ${appointmentId} not found`,
      );
    }

    const myRole = await this.getActiveRole(teamId, userId, team.ownerId);
    const isAllowedRole =
      myRole === TeamRole.OWNER || myRole === TeamRole.ADMIN;
    const isOrganizer = existing.organizerId === userId;
    if (!isAllowedRole && !isOrganizer) {
      throw new ForbiddenException(
        'Only OWNER, ADMIN, or organizer can update this appointment',
      );
    }

    const nextStartAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const nextEndAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    this.assertValidTimeRange(nextStartAt, nextEndAt);

    const requiredParticipantUserIds = existing.participants
      .filter(
        (participant) =>
          participant.participationType === ParticipationType.REQUIRED,
      )
      .map((participant) => participant.userId);

    const conflicts = await this.findRequiredParticipantConflicts({
      requiredParticipantUserIds,
      startAt: nextStartAt,
      endAt: nextEndAt,
      excludeAppointmentId: appointmentId,
    });

    if (conflicts.length) {
      throw new ConflictException({
        message: 'Scheduling conflict',
        conflicts,
      });
    }

    const updated = await this.teamAppointmentRepository.updateTeamAppointment({
      appointmentId,
      title: dto.title ? dto.title.trim() : existing.title,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      location: dto.location !== undefined ? dto.location : existing.location,
      startAt: nextStartAt,
      endAt: nextEndAt,
      status: dto.status ?? existing.status,
    });

    // Send notifications to all participants
    const uniqueParticipantIds = Array.from(
      new Set(updated.participants.map((p) => p.userId)),
    );
    for (const participantId of uniqueParticipantIds) {
      await this.notificationService.sendAndCreateNotification({
        appointment: {
          id: updated.id,
          userId: participantId,
          startAt: updated.startAt,
        },
        title: 'Team Appointment Updated',
        body: `Meeting updated: ${updated.title}`,
        type: 'REMINDER',
        data: {
          teamId: updated.teamId,
        },
      });
    }

    return this.toResponseDto(updated);
  }

  async deleteTeamAppointment(
    userId: string,
    teamId: string,
    appointmentId: string,
  ): Promise<DeleteTeamAppointmentResponseDto> {
    const team = await this.teamAppointmentRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    const existing =
      await this.teamAppointmentRepository.findTeamAppointmentById({
        teamId,
        appointmentId,
      });
    if (!existing) {
      throw new NotFoundException(
        `Team appointment with id ${appointmentId} not found`,
      );
    }

    const myRole = await this.getActiveRole(teamId, userId, team.ownerId);
    const isAllowedRole =
      myRole === TeamRole.OWNER || myRole === TeamRole.ADMIN;
    const isOrganizer = existing.organizerId === userId;
    if (!isAllowedRole && !isOrganizer) {
      throw new ForbiddenException(
        'Only OWNER, ADMIN, or organizer can delete this appointment',
      );
    }

    // Send notifications to all participants before delete
    const uniqueParticipantIds = Array.from(
      new Set(existing.participants.map((p) => p.userId)),
    );
    for (const participantId of uniqueParticipantIds) {
      await this.notificationService.sendAndCreateNotification({
        appointment: {
          id: existing.id,
          userId: participantId,
          startAt: existing.startAt,
        },
        title: 'Team Appointment Cancelled',
        body: `Meeting cancelled: ${existing.title}`,
        type: 'REMINDER',
        data: {
          teamId: existing.teamId,
        },
      });
    }

    await this.teamAppointmentRepository.deleteTeamAppointment(appointmentId);

    return {
      success: true,
      deletedId: appointmentId,
    };
  }

  private normalizeRequiredParticipants(userIds: string[]): string[] {
    const unique = Array.from(new Set(userIds));
    if (!unique.length) {
      throw new BadRequestException(
        'participantUserIds must include at least one user',
      );
    }

    return unique;
  }

  private async assertParticipantsAreActiveMembers(
    teamId: string,
    userIds: string[],
  ): Promise<void> {
    const activeMemberIds =
      await this.teamAppointmentRepository.findActiveMembersByIds({
        teamId,
        userIds,
      });

    const activeSet = new Set(activeMemberIds);
    const invalidUsers = userIds.filter((id) => !activeSet.has(id));

    if (invalidUsers.length) {
      throw new BadRequestException(
        `Participants are not active members of this team: ${invalidUsers.join(', ')}`,
      );
    }
  }

  private async findRequiredParticipantConflicts(input: {
    requiredParticipantUserIds: string[];
    startAt: Date;
    endAt: Date;
    excludeAppointmentId?: string;
  }): Promise<SchedulingConflictItem[]> {
    const conflicts: SchedulingConflictItem[] = [];

    await Promise.all(
      input.requiredParticipantUserIds.map(async (participantUserId) => {
        const [personalConflicts, teamConflicts] = await Promise.all([
          this.teamAppointmentRepository.findPersonalConflicts({
            userId: participantUserId,
            startAt: input.startAt,
            endAt: input.endAt,
          }),
          this.teamAppointmentRepository.findTeamAppointmentConflicts({
            userId: participantUserId,
            startAt: input.startAt,
            endAt: input.endAt,
            excludeAppointmentId: input.excludeAppointmentId,
          }),
        ]);

        personalConflicts.forEach((conflict) => {
          conflicts.push({
            userId: participantUserId,
            conflictWith: 'PERSONAL_APPOINTMENT',
            startAt: conflict.startAt,
            endAt: conflict.endAt,
          });
        });

        teamConflicts.forEach((conflict) => {
          conflicts.push({
            userId: participantUserId,
            conflictWith: 'TEAM_APPOINTMENT',
            startAt: conflict.startAt,
            endAt: conflict.endAt,
          });
        });
      }),
    );

    return conflicts.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  private assertValidTimeRange(startAt: Date, endAt: Date): void {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt');
    }

    if (startAt.getTime() >= endAt.getTime()) {
      throw new BadRequestException('startAt must be before endAt');
    }
  }

  private async assertActiveMember(
    teamId: string,
    userId: string,
    ownerId: string,
  ): Promise<void> {
    const role = await this.getActiveRole(teamId, userId, ownerId);
    if (!role) {
      throw new ForbiddenException('You are not an active member of this team');
    }
  }

  private async getActiveRole(
    teamId: string,
    userId: string,
    ownerId: string,
  ): Promise<TeamRole | null> {
    if (ownerId === userId) {
      return TeamRole.OWNER;
    }

    const membership =
      await this.teamAppointmentRepository.findActiveMembership({
        teamId,
        userId,
      });

    return membership?.role ?? null;
  }

  private toResponseDto(entity: {
    id: string;
    teamId: string;
    organizerId: string;
    title: string;
    description: string | null;
    location: string | null;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    participants: Array<{ userId: string }>;
    createdAt: Date;
    updatedAt: Date;
  }): TeamAppointmentResponseDto {
    return {
      id: entity.id,
      teamId: entity.teamId,
      organizerId: entity.organizerId,
      title: entity.title,
      description: entity.description,
      location: entity.location,
      startAt: entity.startAt,
      endAt: entity.endAt,
      status: entity.status,
      participants: entity.participants.map((participant) => ({
        userId: participant.userId,
      })),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
