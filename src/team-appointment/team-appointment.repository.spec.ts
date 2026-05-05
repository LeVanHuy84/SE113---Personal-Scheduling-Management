import { TeamAppointmentRepository } from './team-appointment.repository';

describe('TeamAppointmentRepository', () => {
  it('should query all active member profiles for a team', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new TeamAppointmentRepository({
      teamMember: {
        findMany,
      },
    } as any);

    await repository.findActiveMemberProfilesByTeamId('team-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        teamId: 'team-1',
        status: 'ACTIVE',
      },
      select: {
        userId: true,
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });
  });
});
