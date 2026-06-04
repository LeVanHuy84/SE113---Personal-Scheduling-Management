import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function toUtcDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes = 0,
) {
  return new Date(Date.UTC(year, month, day, hours, minutes, 0));
}

async function main() {
  console.log('Deleting existing data (safe deleteMany order)...');
  await prisma.notification.deleteMany();
  await prisma.appointmentParticipant.deleteMany();
  await prisma.teamAppointment.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.seriesTag.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentSeries.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.userMonthlyStat.deleteMany();
  await prisma.userDevice.deleteMany();
  await prisma.authAttempt.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash: bcrypt.hashSync('password', 10),
      isVerified: true,
      displayName: 'Alice',
      timezone: 'UTC',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: bcrypt.hashSync('password', 10),
      isVerified: true,
      displayName: 'Bob',
      timezone: 'UTC',
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      passwordHash: bcrypt.hashSync('password', 10),
      isVerified: true,
      displayName: 'Carol',
      timezone: 'UTC',
    },
  });

  console.log('Creating tags...');
  const workTag = await prisma.tag.create({
    data: { userId: alice.id, name: 'work', color: '#FF6B6B' },
  });
  const healthTag = await prisma.tag.create({
    data: { userId: bob.id, name: 'health', color: '#4ECDC4' },
  });
  const learningTag = await prisma.tag.create({
    data: { userId: carol.id, name: 'learning', color: '#556270' },
  });

  console.log('Creating personal series and appointments...');
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  const aliceSeries = await prisma.appointmentSeries.create({
    data: {
      userId: alice.id,
      title: 'Design review',
      description: 'Review weekly designs',
      startAt: toUtcDate(year, month, day, 9),
      endAt: toUtcDate(year, month, day, 10),
      recurrenceType: 'ONETIME',
      seriesTimezone: 'UTC',
    },
  });

  await prisma.seriesTag.create({
    data: { seriesId: aliceSeries.id, tagId: workTag.id },
  });

  const bobSeries = await prisma.appointmentSeries.create({
    data: {
      userId: bob.id,
      title: 'Gym routine',
      description: 'Daily gym session',
      startAt: toUtcDate(year, month, day, 7),
      endAt: toUtcDate(year, month, day, 8),
      recurrenceType: 'ONETIME',
      seriesTimezone: 'UTC',
    },
  });

  await prisma.seriesTag.create({
    data: { seriesId: bobSeries.id, tagId: healthTag.id },
  });

  const carolSeries = await prisma.appointmentSeries.create({
    data: {
      userId: carol.id,
      title: 'Study sprint',
      description: 'Time for focused learning',
      startAt: toUtcDate(year, month, day, 14),
      endAt: toUtcDate(year, month, day, 15),
      recurrenceType: 'ONETIME',
      seriesTimezone: 'UTC',
    },
  });

  await prisma.seriesTag.create({
    data: { seriesId: carolSeries.id, tagId: learningTag.id },
  });

  const personalAppointments = [
    {
      user: alice,
      seriesId: aliceSeries.id,
      items: [
        {
          start: toUtcDate(year, month, day, 9),
          end: toUtcDate(year, month, day, 10),
          status: 'SCHEDULED',
        },
        {
          start: toUtcDate(year, month, day + 1, 11),
          end: toUtcDate(year, month, day + 1, 12),
          status: 'SCHEDULED',
        },
        {
          start: toUtcDate(year, month, day - 2, 9),
          end: toUtcDate(year, month, day - 2, 10),
          status: 'COMPLETED',
        },
        {
          start: toUtcDate(year, month, day - 5, 15),
          end: toUtcDate(year, month, day - 5, 16),
          status: 'CANCELLED',
        },
      ],
    },
    {
      user: bob,
      seriesId: bobSeries.id,
      items: [
        {
          start: toUtcDate(year, month, day, 7),
          end: toUtcDate(year, month, day, 8),
          status: 'SCHEDULED',
        },
        {
          start: toUtcDate(year, month, day + 1, 7),
          end: toUtcDate(year, month, day + 1, 8),
          status: 'SCHEDULED',
        },
        {
          start: toUtcDate(year, month, day - 1, 7),
          end: toUtcDate(year, month, day - 1, 8),
          status: 'COMPLETED',
        },
        {
          start: toUtcDate(year, month, day - 3, 7),
          end: toUtcDate(year, month, day - 3, 8),
          status: 'MISSED',
        },
      ],
    },
    {
      user: carol,
      seriesId: carolSeries.id,
      items: [
        {
          start: toUtcDate(year, month, day, 14),
          end: toUtcDate(year, month, day, 15),
          status: 'SCHEDULED',
        },
        {
          start: toUtcDate(year, month, day + 2, 14),
          end: toUtcDate(year, month, day + 2, 15),
          status: 'SCHEDULED',
        },
        {
          start: toUtcDate(year, month, day - 4, 14),
          end: toUtcDate(year, month, day - 4, 15),
          status: 'COMPLETED',
        },
      ],
    },
  ];

  for (const block of personalAppointments) {
    for (const item of block.items) {
      await prisma.appointment.create({
        data: {
          userId: block.user.id,
          seriesId: block.seriesId,
          startAt: item.start,
          endAt: item.end,
          status: item.status as any,
        },
      });
    }
  }

  console.log('Creating team and team appointment data...');
  const team = await prisma.team.create({
    data: {
      ownerId: alice.id,
      name: 'Alpha Team',
      description: 'Team workspace for Alice, Bob, and Carol',
    },
  });

  await prisma.teamMember.create({
    data: { teamId: team.id, userId: bob.id, role: 'MEMBER' },
  });
  await prisma.teamMember.create({
    data: { teamId: team.id, userId: carol.id, role: 'ADMIN' },
  });

  const teamAppointments = [
    {
      title: 'Team sync',
      description: 'Weekly planning and blockers',
      start: toUtcDate(year, month, day, 11),
      end: toUtcDate(year, month, day, 12),
      status: 'SCHEDULED',
      participants: [bob.id, carol.id],
    },
    {
      title: 'Project retrospective',
      description: 'Review last sprint outcomes',
      start: toUtcDate(year, month, day - 2, 16),
      end: toUtcDate(year, month, day - 2, 17),
      status: 'COMPLETED',
      participants: [bob.id, carol.id],
    },
  ];

  for (const item of teamAppointments) {
    const appointment = await prisma.teamAppointment.create({
      data: {
        teamId: team.id,
        organizerId: alice.id,
        title: item.title,
        description: item.description,
        startAt: item.start,
        endAt: item.end,
        status: item.status as any,
      },
    });

    for (const participantId of item.participants) {
      await prisma.appointmentParticipant.create({
        data: {
          teamAppointmentId: appointment.id,
          userId: participantId,
          participationType: 'REQUIRED',
        },
      });
    }
  }

  console.log('Creating notifications and monthly stats...');
  await prisma.notification.create({
    data: {
      userId: alice.id,
      actorUserId: bob.id,
      type: 'SYSTEM',
      title: 'Team created',
      message: 'Alpha Team has been created and seeded with appointments.',
    },
  });

  await prisma.notification.create({
    data: {
      userId: carol.id,
      actorUserId: alice.id,
      type: 'SYSTEM',
      title: 'Team invite accepted',
      message: 'Carol joined Alpha Team as an admin.',
    },
  });

  const currentMonth = toUtcDate(year, month, 1, 0);
  await prisma.userMonthlyStat.createMany({
    data: [
      {
        userId: alice.id,
        month: currentMonth,
        totalCount: 4,
        completedCount: 1,
        completionRate: new Prisma.Decimal('0.2500'),
        topSlot: '09:00-10:00',
      },
      {
        userId: bob.id,
        month: currentMonth,
        totalCount: 4,
        completedCount: 1,
        completionRate: new Prisma.Decimal('0.2500'),
        topSlot: '07:00-08:00',
      },
      {
        userId: carol.id,
        month: currentMonth,
        totalCount: 3,
        completedCount: 1,
        completionRate: new Prisma.Decimal('0.3333'),
        topSlot: '14:00-15:00',
      },
    ],
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
