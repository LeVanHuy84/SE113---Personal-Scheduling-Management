import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { ParticipantSelectionMode } from './dto/create-team-appointment-request.dto';
import { TeamAppointmentService } from './team-appointment.service';

describe('TeamAppointmentService (Business-rule driven tests)', () => {
  let service: TeamAppointmentService;
  const mockRepo: any = {};
  const mockNotificationService: any = {
    sendAndCreateNotification: jest.fn(),
  };

  beforeEach(() => {
    for (const key of Object.keys(mockRepo)) mockRepo[key] = mockRepo[key];
    mockNotificationService.sendAndCreateNotification.mockReset();
    service = new TeamAppointmentService(mockRepo, mockNotificationService);
  });

  describe('createTeamAppointment (FR-TA-Create Owner/Admin only)', () => {
    it('should forbid non-owner/non-admin from creating team appointment (FR-TA-Create)', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.MEMBER });

      await expect(
        service.createTeamAppointment('user-2', 't1', {
          title: 'Meeting',
          startAt: new Date().toISOString(),
          endAt: new Date(Date.now() + 3600000).toISOString(),
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should include all active team members by default', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.OWNER });
      mockRepo.findActiveMemberProfilesByTeamId = jest.fn().mockResolvedValue([
        { userId: 'owner-1', displayName: 'Owner' },
        { userId: 'u2', displayName: 'User 2' },
        { userId: 'u3', displayName: 'User 3' },
      ]);
      mockRepo.findPersonalConflicts = jest.fn().mockResolvedValue([]);
      mockRepo.findTeamAppointmentConflicts = jest.fn().mockResolvedValue([]);
      mockRepo.createTeamAppointment = jest.fn().mockResolvedValue({
        id: 'a1',
        teamId: 't1',
        organizerId: 'owner-1',
        title: 't',
        description: null,
        location: null,
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        participants: [
          { userId: 'owner-1', participationType: 'REQUIRED' },
          { userId: 'u2', participationType: 'REQUIRED' },
          { userId: 'u3', participationType: 'REQUIRED' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.createTeamAppointment('owner-1', 't1', {
        title: 'Meeting',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      } as any);

      const calledWith = mockRepo.createTeamAppointment.mock.calls[0][0];
      expect(calledWith.participantUserIds).toEqual(['owner-1', 'u2', 'u3']);
    });

    it('should reject duplicate participantUserIds when CUSTOM is selected', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.OWNER });

      await expect(
        service.createTeamAppointment('owner-1', 't1', {
          title: 'Meeting',
          startAt: new Date().toISOString(),
          endAt: new Date(Date.now() + 3600000).toISOString(),
          participantSelectionMode: ParticipantSelectionMode.CUSTOM,
          participantUserIds: ['u1', 'u1'],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject participants who are not active members when CUSTOM is selected', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.OWNER });
      mockRepo.findActiveMemberProfilesByIds = jest
        .fn()
        .mockResolvedValue([{ userId: 'u1', displayName: 'User1' }]);

      await expect(
        service.createTeamAppointment('owner-1', 't1', {
          title: 'Meeting',
          startAt: new Date().toISOString(),
          endAt: new Date(Date.now() + 3600000).toISOString(),
          participantSelectionMode: ParticipantSelectionMode.CUSTOM,
          participantUserIds: ['u1', 'u2'],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return conflicts but still create appointment in ALL mode', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.OWNER });
      mockRepo.findActiveMemberProfilesByTeamId = jest
        .fn()
        .mockResolvedValue([{ userId: 'owner-1', displayName: 'Owner' }]);
      mockRepo.findPersonalConflicts = jest
        .fn()
        .mockResolvedValue([
          { startAt: new Date(), endAt: new Date(Date.now() + 1000) },
        ]);
      mockRepo.findTeamAppointmentConflicts = jest.fn().mockResolvedValue([]);
      mockRepo.createTeamAppointment = jest.fn().mockResolvedValue({
        id: 'a1',
        teamId: 't1',
        organizerId: 'owner-1',
        title: 't',
        description: null,
        location: null,
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
        status: 'SCHEDULED',
        participants: [{ userId: 'owner-1', participationType: 'REQUIRED' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.createTeamAppointment('owner-1', 't1', {
        title: 'Meeting',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      } as any);

      expect(res.hasConflict).toBe(true);
      expect(res.conflicts).toBeDefined();
      expect(res.conflicts!.length).toBeGreaterThan(0);
    });
  });

  describe('checkTeamAvailability (FR-TA-Availability)', () => {
    it('should return suggested slots and availability without modifying data (FR-TA-Availability)', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.MEMBER });
      mockRepo.findActiveMemberProfilesByIds = jest
        .fn()
        .mockResolvedValue([{ userId: 'u1', displayName: 'U1' }]);
      mockRepo.findPersonalConflicts = jest.fn().mockResolvedValue([]);
      mockRepo.findTeamAppointmentConflicts = jest.fn().mockResolvedValue([]);

      const res = await service.checkTeamAvailability('u1', 't1', {
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
        participantUserIds: ['u1'],
      } as any);

      expect(Array.isArray(res.suggestedSlots)).toBe(true);
      expect(res.hasConflict).toBe(false);
      expect(
        res.availableParticipants.some((p: any) => p.userId === 'u1'),
      ).toBeTruthy();
    });
  });
});
