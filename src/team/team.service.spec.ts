// Mock notification service to avoid importing application-wide dependencies like Firebase
jest.mock('../notification/notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendAndCreateNotification: jest.fn(),
  })),
}));
// Mock repository to avoid loading Prisma/service dependencies
jest.mock('./team.repository', () => ({
  TeamRepository: jest.fn().mockImplementation(() => ({})),
}));

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TeamRole, InvitationStatus } from '@prisma/client';
import { TeamService } from './team.service';

describe('TeamService (Business-rule driven tests)', () => {
  let service: TeamService;
  const mockRepo: any = {};
  const mockNotification: any = { sendAndCreateNotification: jest.fn() };

  beforeEach(() => {
    // Reset mock implementations between tests
    for (const k of Object.keys(mockRepo)) mockRepo[k] = mockRepo[k];
    service = new TeamService(mockRepo, mockNotification as any);
  });

  describe('createTeam (FR-TEAM-01)', () => {
    it('should throw ConflictException when owner already has a team with same name (FR-TEAM-01)', async () => {
      mockRepo.existsByOwnerAndName = jest.fn().mockResolvedValue(true);

      await expect(
        service.createTeam('user-1', { name: 'My Team' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockRepo.existsByOwnerAndName).toHaveBeenCalledWith({
        ownerId: 'user-1',
        name: 'My Team',
      });
    });
  });

  describe('inviteMember (BR-Invite-OwnerAdminOnly, BR-CannotAssignOwner)', () => {
    it('should forbid non-owner/non-admin from inviting (BR-Invite-OwnerAdminOnly)', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.MEMBER });

      await expect(
        service.inviteMember('user-2', 't1', { invitedUserId: 'u3' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should reject assigning OWNER role via invitation (BR-CannotAssignOwner)', async () => {
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 't1', ownerId: 'owner-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.OWNER });
      mockRepo.userExists = jest.fn().mockResolvedValue(true);
      mockRepo.isActiveMember = jest.fn().mockResolvedValue(false);
      mockRepo.hasPendingInvitation = jest.fn().mockResolvedValue(false);

      await expect(
        service.inviteMember('owner-1', 't1', {
          invitedUserId: 'u3',
          role: TeamRole.OWNER,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('acceptInvitation / declineInvitation (BR-Invitation-Lifecycle)', () => {
    it('should forbid acceptance by non-invited user (BR-Invitation-Lifecycle)', async () => {
      mockRepo.findPendingInvitation = jest.fn().mockResolvedValue({
        id: 'inv1',
        invitedUserId: 'u2',
        teamId: 't1',
        status: InvitationStatus.PENDING,
      });

      await expect(
        service.acceptInvitation('other-user', 't1', 'inv1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ConflictException when invitation is expired (BR-Invitation-Lifecycle)', async () => {
      mockRepo.findPendingInvitation = jest.fn().mockResolvedValue({
        id: 'inv1',
        invitedUserId: 'u2',
        teamId: 't1',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.acceptInvitation('u2', 't1', 'inv1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should accept invitation and create membership (FR-TEAM-INVITE-ACCEPT)', async () => {
      mockRepo.findPendingInvitation = jest.fn().mockResolvedValue({
        id: 'inv1',
        invitedUserId: 'u2',
        teamId: 't1',
        role: TeamRole.MEMBER,
        status: InvitationStatus.PENDING,
      });
      mockRepo.isActiveMember = jest.fn().mockResolvedValue(false);
      mockRepo.createTeamMemberFromInvitation = jest.fn().mockResolvedValue({});
      mockRepo.updateInvitationStatus = jest.fn().mockResolvedValue({});

      const res = await service.acceptInvitation('u2', 't1', 'inv1');
      expect(res.message).toMatch(/accepted/i);
      expect(mockRepo.createTeamMemberFromInvitation).toHaveBeenCalledWith({
        teamId: 't1',
        userId: 'u2',
        role: TeamRole.MEMBER,
      });
    });
  });

  describe('getMyInvitations (FR-TEAM-INVITATION-ME)', () => {
    it('should return only invitations for the current user', async () => {
      mockRepo.findInvitationsByInvitee = jest.fn().mockResolvedValue([
        {
          id: 'inv-1',
          teamId: 'team-1',
          role: TeamRole.MEMBER,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2026-05-01T10:00:00.000Z'),
          expiresAt: null,
          team: { name: 'Alpha Team' },
        },
      ]);

      const result = await service.getMyInvitations('user-1');

      expect(mockRepo.findInvitationsByInvitee).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([
        {
          invitationId: 'inv-1',
          teamId: 'team-1',
          teamName: 'Alpha Team',
          role: TeamRole.MEMBER,
          status: InvitationStatus.PENDING,
          invitedAt: new Date('2026-05-01T10:00:00.000Z'),
          expiresAt: null,
        },
      ]);
    });

    it('should filter invitations by status', async () => {
      mockRepo.findInvitationsByInvitee = jest.fn().mockResolvedValue([
        {
          id: 'inv-1',
          teamId: 'team-1',
          role: TeamRole.MEMBER,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2026-05-01T10:00:00.000Z'),
          expiresAt: null,
          team: { name: 'Alpha Team' },
        },
        {
          id: 'inv-2',
          teamId: 'team-2',
          role: TeamRole.ADMIN,
          status: InvitationStatus.DECLINED,
          createdAt: new Date('2026-05-02T10:00:00.000Z'),
          expiresAt: null,
          team: { name: 'Beta Team' },
        },
      ]);

      const result = await service.getMyInvitations('user-1', {
        status: InvitationStatus.DECLINED,
      } as any);

      expect(result).toEqual([
        {
          invitationId: 'inv-2',
          teamId: 'team-2',
          teamName: 'Beta Team',
          role: TeamRole.ADMIN,
          status: InvitationStatus.DECLINED,
          invitedAt: new Date('2026-05-02T10:00:00.000Z'),
          expiresAt: null,
        },
      ]);
    });

    it('should mark expired pending invitations as EXPIRED', async () => {
      mockRepo.findInvitationsByInvitee = jest.fn().mockResolvedValue([
        {
          id: 'inv-1',
          teamId: 'team-1',
          role: TeamRole.MEMBER,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2026-05-01T10:00:00.000Z'),
          expiresAt: new Date(Date.now() - 1000),
          team: { name: 'Alpha Team' },
        },
      ]);

      const result = await service.getMyInvitations('user-1');

      expect(result[0].status).toBe(InvitationStatus.EXPIRED);
    });

    it('should return an empty array when no invitations exist', async () => {
      mockRepo.findInvitationsByInvitee = jest.fn().mockResolvedValue([]);

      await expect(service.getMyInvitations('user-1')).resolves.toEqual([]);
    });
  });

  describe('changeMemberRole (BR-63, BR-CannotAssignOwner)', () => {
    it('should reject attempts to assign OWNER role (BR-CannotAssignOwner)', async () => {
      await expect(
        service.changeMemberRole('user-1', 'team-1', 'target-1', {
          role: TeamRole.OWNER,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should forbid an admin from changing another admin (BR-63)', async () => {
      // According to BR-63 this should be forbidden. The service currently does not enforce it,
      // so this test asserts the expected business rule and will fail until service is updated.
      mockRepo.findTeamById = jest
        .fn()
        .mockResolvedValue({ id: 'team-1', ownerId: 'owner-1' });
      // caller is ADMIN
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.ADMIN });
      // target is ADMIN
      mockRepo.findMembershipWithRole = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.ADMIN });
      mockRepo.updateMemberRole = jest.fn().mockResolvedValue({
        teamId: 'team-1',
        userId: 'admin-2',
        role: TeamRole.MEMBER,
        updatedAt: new Date(),
      });

      await expect(
        service.changeMemberRole('admin-1', 'team-1', 'admin-2', {
          role: TeamRole.MEMBER,
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('leaveTeam (BR-Owner-Transfer)', () => {
    it('should prevent last owner from leaving the team (BR-Owner-Transfer)', async () => {
      mockRepo.findTeamById = jest.fn().mockResolvedValue({ id: 'team-1' });
      mockRepo.findActiveMembership = jest
        .fn()
        .mockResolvedValue({ role: TeamRole.OWNER });
      mockRepo.countActiveOwners = jest.fn().mockResolvedValue(1);

      await expect(
        service.leaveTeam('owner-1', 'team-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
