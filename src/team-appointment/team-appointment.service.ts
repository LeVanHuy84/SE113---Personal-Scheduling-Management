import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentStatus, ParticipationType, TeamRole } from '@prisma/client';
import { PaginationResponseDto } from 'src/common/dto/pagination.dto';
import { CheckTeamAppointmentConflictsRequestDto } from './dto/check-team-appointment-conflicts-request.dto';
import {
  CheckTeamAppointmentConflictsResponseDto,
  SuggestedSlotDto,
} from './dto/check-team-appointment-conflicts-response.dto';
import {
  CreateTeamAppointmentRequestDto,
  ParticipantSelectionMode,
} from './dto/create-team-appointment-request.dto';
import { DeleteTeamAppointmentResponseDto } from './dto/delete-team-appointment-response.dto';
import { GetTeamAppointmentsQueryDto } from './dto/get-team-appointments-query.dto';
import {
  TeamAppointmentConflictDto,
  TeamAppointmentResponseDto,
} from './dto/team-appointment-response.dto';
import { UpdateTeamAppointmentRequestDto } from './dto/update-team-appointment-request.dto';
import { TeamAppointmentRepository } from './team-appointment.repository';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType, NotificationEventType } from '@prisma/client';

type ConflictWith = 'PERSONAL_APPOINTMENT' | 'TEAM_APPOINTMENT';

type SchedulingConflictRecord = {
  userId: string;
  conflictWith: ConflictWith;
  startAt: Date;
  endAt: Date;
  displayName?: string;
  summary?: string;
};

type ParticipantProfile = {
  userId: string;
  displayName: string;
};

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

    const createParticipants = await this.resolveCreateParticipants(
      teamId,
      userId,
      dto,
    );
    const conflicts = await this.findSchedulingConflicts({
      participantUserIds: createParticipants.participantUserIds,
      startAt,
      endAt,
      profiles: createParticipants.profiles,
    });

    if (conflicts.length > 0) {
      throw new ConflictException('Overlapping team appointment');
    }

    const created = await this.teamAppointmentRepository.createTeamAppointment({
      teamId,
      organizerId: userId,
      title: dto.title.trim(),
      description: dto.description ?? null,
      location: dto.location ?? null,
      startAt,
      endAt,
      participantUserIds: createParticipants.participantUserIds,
    });

    // Fan-out notifications to participants (exclude organizer)
    const participantUserIds = created.participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);
    if (participantUserIds.length > 0) {
      const notifyPromises = participantUserIds.map((uid) =>
        this.notificationService.sendAndCreateNotification({
          userId: uid,
          actorUserId: userId,
          type: NotificationType.TEAM_ACTIVITY,
          eventType: NotificationEventType.TEAM_APPOINTMENT_CREATED,
          teamAppointmentId: created.id,
          title: `New team appointment: ${created.title}`,
          body: `${created.title} scheduled by ${userId}`,
          payload: { teamId: created.teamId },
        }),
      );
      Promise.allSettled(notifyPromises).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            // swallow errors for now
          }
        });
      });
    }

    return this.toResponseDto(
      created,
      conflicts.map((conflict) => ({
        userId: conflict.userId,
        conflictWith: conflict.conflictWith,
        startAt: conflict.startAt,
        endAt: conflict.endAt,
      })),
    );
  }

  async listTeamAppointments(
    userId: string,
    teamId: string,
    query: GetTeamAppointmentsQueryDto,
  ): Promise<PaginationResponseDto<any>> {
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

    return {
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
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

    const participantUserIds = this.normalizeParticipantUserIds(
      dto.participantUserIds || [],
    );
    await this.assertParticipantsAreActiveMembers(teamId, participantUserIds);

    const allParticipantUserIds = this.buildParticipantUserIds(
      existing.organizerId,
      participantUserIds,
    );
    const conflicts = await this.findSchedulingConflicts({
      participantUserIds: allParticipantUserIds,
      startAt: nextStartAt,
      endAt: nextEndAt,
      excludeAppointmentId: appointmentId,
    });

    if (conflicts.length > 0) {
      throw new ConflictException('Overlapping team appointment');
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
      participantUserIds: allParticipantUserIds,
    });
    // notify participants except actor
    const participantsToNotify = updated.participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);
    if (participantsToNotify.length > 0) {
      const notifyPromises = participantsToNotify.map((uid) =>
        this.notificationService.sendAndCreateNotification({
          userId: uid,
          actorUserId: userId,
          type: NotificationType.TEAM_ACTIVITY,
          eventType: NotificationEventType.TEAM_APPOINTMENT_UPDATED,
          teamAppointmentId: updated.id,
          title: `Updated team appointment: ${updated.title}`,
          body: `${updated.title} was updated by ${userId}`,
          payload: { teamId: updated.teamId },
        }),
      );
      Promise.allSettled(notifyPromises);
    }

    return this.toResponseDto(
      updated,
      conflicts.map((conflict) => ({
        userId: conflict.userId,
        conflictWith: conflict.conflictWith,
        startAt: conflict.startAt,
        endAt: conflict.endAt,
      })),
    );
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

    // notify participants (except actor) about deletion
    const participantsToNotify = existing.participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);
    if (participantsToNotify.length > 0) {
      const notifyPromises = participantsToNotify.map((uid) =>
        this.notificationService.sendAndCreateNotification({
          userId: uid,
          actorUserId: userId,
          type: NotificationType.TEAM_ACTIVITY,
          eventType: NotificationEventType.TEAM_APPOINTMENT_CANCELLED,
          teamAppointmentId: appointmentId,
          title: `Cancelled team appointment: ${existing.title}`,
          body: `${existing.title} was cancelled by ${userId}`,
          payload: { teamId: existing.teamId },
        }),
      );
      Promise.allSettled(notifyPromises);
    }

    await this.teamAppointmentRepository.deleteTeamAppointment(appointmentId);

    return {
      success: true,
      deletedId: appointmentId,
    };
  }

  async checkTeamAvailability(
    userId: string,
    teamId: string,
    dto: CheckTeamAppointmentConflictsRequestDto,
  ): Promise<CheckTeamAppointmentConflictsResponseDto> {
    const team = await this.teamAppointmentRepository.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    await this.assertActiveMember(teamId, userId, team.ownerId);

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.assertValidTimeRange(startAt, endAt);

    const participantUserIds = this.normalizeParticipantUserIds(
      dto.participantUserIds,
    );
    const profiles = await this.assertAndLoadParticipantProfiles(
      teamId,
      participantUserIds,
    );

    const conflicts = await this.findSchedulingConflicts({
      participantUserIds,
      startAt,
      endAt,
      profiles,
    });

    const busyUserIds = new Set(conflicts.map((conflict) => conflict.userId));
    const availableParticipants = profiles.filter(
      (participant) => !busyUserIds.has(participant.userId),
    );
    const busyParticipants = profiles.filter((participant) =>
      busyUserIds.has(participant.userId),
    );
    const suggestedSlots = await this.buildSuggestedSlots({
      participantUserIds,
      durationMs: endAt.getTime() - startAt.getTime(),
      searchFrom: endAt,
    });

    return {
      teamId,
      startAt,
      endAt,
      hasConflict: conflicts.length > 0,
      availableParticipants,
      busyParticipants,
      conflicts: conflicts.map((conflict) =>
        this.toAvailabilityConflictDto(conflict),
      ),
      suggestedSlots,
    };
  }

  private normalizeParticipantUserIds(userIds: string[]): string[] {
    const unique = Array.from(new Set(userIds));
    if (unique.length !== userIds.length) {
      throw new BadRequestException(
        'participantUserIds must not contain duplicates',
      );
    }

    return unique;
  }

  private buildParticipantUserIds(
    organizerId: string,
    participantUserIds: string[],
  ): string[] {
    return Array.from(new Set([organizerId, ...participantUserIds]));
  }

  private async resolveCreateParticipants(
    teamId: string,
    organizerId: string,
    dto: CreateTeamAppointmentRequestDto,
  ): Promise<{
    participantUserIds: string[];
    profiles: ParticipantProfile[];
  }> {
    if (dto.participantSelectionMode !== ParticipantSelectionMode.CUSTOM) {
      const profiles =
        await this.teamAppointmentRepository.findActiveMemberProfilesByTeamId(
          teamId,
        );

      return {
        participantUserIds: profiles.map((profile) => profile.userId),
        profiles,
      };
    }

    const selectedParticipantUserIds = this.normalizeParticipantUserIds(
      dto.participantUserIds ?? [],
    );
    await this.assertParticipantsAreActiveMembers(
      teamId,
      selectedParticipantUserIds,
    );

    const participantUserIds = this.buildParticipantUserIds(
      organizerId,
      selectedParticipantUserIds,
    );
    const profiles = await this.assertAndLoadParticipantProfiles(
      teamId,
      participantUserIds,
    );

    return {
      participantUserIds,
      profiles,
    };
  }

  private async assertAndLoadParticipantProfiles(
    teamId: string,
    userIds: string[],
  ): Promise<ParticipantProfile[]> {
    const profiles =
      await this.teamAppointmentRepository.findActiveMemberProfilesByIds({
        teamId,
        userIds,
      });

    const activeSet = new Set(profiles.map((profile) => profile.userId));
    const invalidUsers = userIds.filter((id) => !activeSet.has(id));
    if (invalidUsers.length) {
      throw new BadRequestException(
        `Participants are not active members of this team: ${invalidUsers.join(', ')}`,
      );
    }

    return profiles;
  }

  private async assertParticipantsAreActiveMembers(
    teamId: string,
    userIds: string[],
  ): Promise<void> {
    await this.assertAndLoadParticipantProfiles(teamId, userIds);
  }

  private async findSchedulingConflicts(input: {
    participantUserIds: string[];
    startAt: Date;
    endAt: Date;
    excludeAppointmentId?: string;
    profiles?: ParticipantProfile[];
  }): Promise<SchedulingConflictRecord[]> {
    const profilesByUserId = new Map(
      (input.profiles ?? []).map((profile) => [
        profile.userId,
        profile.displayName,
      ]),
    );
    const conflicts: SchedulingConflictRecord[] = [];

    await Promise.all(
      input.participantUserIds.map(async (participantUserId) => {
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
            displayName: profilesByUserId.get(participantUserId),
            summary: 'Personal appointment overlaps the requested team time.',
          });
        });

        teamConflicts.forEach((conflict) => {
          conflicts.push({
            userId: participantUserId,
            conflictWith: 'TEAM_APPOINTMENT',
            startAt: conflict.startAt,
            endAt: conflict.endAt,
            displayName: profilesByUserId.get(participantUserId),
            summary: 'Team appointment overlaps the requested team time.',
          });
        });
      }),
    );

    return conflicts.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  private async buildSuggestedSlots(input: {
    participantUserIds: string[];
    durationMs: number;
    searchFrom: Date;
  }): Promise<SuggestedSlotDto[]> {
    const searchEnd = new Date(
      input.searchFrom.getTime() + 24 * 60 * 60 * 1000,
    );
    const busyIntervals = await this.findBusyIntervals({
      participantUserIds: input.participantUserIds,
      startAt: input.searchFrom,
      endAt: searchEnd,
    });

    const mergedBusyIntervals = this.mergeIntervals(busyIntervals);
    const slots: SuggestedSlotDto[] = [];
    const stepMs = 30 * 60 * 1000;

    for (
      let candidateStart = input.searchFrom.getTime();
      candidateStart + input.durationMs <= searchEnd.getTime() &&
      slots.length < 2;
      candidateStart += stepMs
    ) {
      const candidateEnd = candidateStart + input.durationMs;
      if (!this.hasOverlap(mergedBusyIntervals, candidateStart, candidateEnd)) {
        slots.push({
          startAt: new Date(candidateStart),
          endAt: new Date(candidateEnd),
        });
      }
    }

    return slots;
  }

  private async findBusyIntervals(input: {
    participantUserIds: string[];
    startAt: Date;
    endAt: Date;
  }): Promise<Array<{ startAt: Date; endAt: Date }>> {
    const intervals: Array<{ startAt: Date; endAt: Date }> = [];

    await Promise.all(
      input.participantUserIds.map(async (participantUserId) => {
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
          }),
        ]);

        personalConflicts.forEach((conflict) => {
          intervals.push({ startAt: conflict.startAt, endAt: conflict.endAt });
        });

        teamConflicts.forEach((conflict) => {
          intervals.push({ startAt: conflict.startAt, endAt: conflict.endAt });
        });
      }),
    );

    return intervals;
  }

  private mergeIntervals(
    intervals: Array<{ startAt: Date; endAt: Date }>,
  ): Array<{
    startAt: number;
    endAt: number;
  }> {
    if (!intervals.length) {
      return [];
    }

    const sorted = intervals
      .map((interval) => ({
        startAt: interval.startAt.getTime(),
        endAt: interval.endAt.getTime(),
      }))
      .sort((a, b) => a.startAt - b.startAt);

    const merged: Array<{ startAt: number; endAt: number }> = [sorted[0]];

    for (let index = 1; index < sorted.length; index += 1) {
      const current = sorted[index];
      const last = merged[merged.length - 1];

      if (current.startAt <= last.endAt) {
        last.endAt = Math.max(last.endAt, current.endAt);
        continue;
      }

      merged.push({ ...current });
    }

    return merged;
  }

  private hasOverlap(
    intervals: Array<{ startAt: number; endAt: number }>,
    startAt: number,
    endAt: number,
  ): boolean {
    return intervals.some(
      (interval) => interval.startAt < endAt && interval.endAt > startAt,
    );
  }

  private assertValidTimeRange(startAt: Date, endAt: Date): void {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt');
    }

    if (startAt.getTime() >= endAt.getTime()) {
      throw new BadRequestException('startAt must be before endAt');
    }

    const durationMs = endAt.getTime() - startAt.getTime();
    if (durationMs > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Appointment duration cannot exceed 24 hours');
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

  private toResponseDto(
    entity: {
      id: string;
      teamId: string;
      organizerId: string;
      title: string;
      description: string | null;
      location: string | null;
      startAt: Date;
      endAt: Date;
      status: AppointmentStatus;
      participants: Array<{
        userId: string;
        participationType: ParticipationType;
      }>;
      createdAt: Date;
      updatedAt: Date;
    },
    conflicts?: TeamAppointmentConflictDto[],
  ): TeamAppointmentResponseDto {
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
        participationType: participant.participationType,
      })),
      hasConflict: conflicts ? conflicts.length > 0 : undefined,
      conflicts,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toAvailabilityConflictDto(
    conflict: SchedulingConflictRecord,
  ): TeamAppointmentConflictDto {
    return {
      userId: conflict.userId,
      conflictWith: conflict.conflictWith,
      startAt: conflict.startAt,
      endAt: conflict.endAt,
      displayName: conflict.displayName,
      summary: conflict.summary,
    };
  }
}
