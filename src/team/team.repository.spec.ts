import { TeamRepository } from './team.repository';

describe('TeamRepository', () => {
  it('should query invitations by invited user only', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new TeamRepository({
      teamInvitation: {
        findMany,
      },
    } as any);

    await repository.findInvitationsByInvitee('user-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        invitedUserId: 'user-1',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        teamId: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    });
  });
});
