import { NotificationEventType, NotificationType } from '@prisma/client';
import { ReminderProcessor } from './reminder.processor';

describe('ReminderProcessor', () => {
  let processor: ReminderProcessor;
  let prisma: {
    appointment: {
      findUnique: jest.Mock;
    };
  };
  let emailService: {
    sendReminderEmail: jest.Mock;
  };
  let notificationService: {
    sendAndCreateNotification: jest.Mock;
  };

  const appointmentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const baseAppointment = {
    id: appointmentId,
    userId: 'u-1',
    startAt: new Date('2026-05-20T09:00:00.000Z'),
    user: {
      id: 'u-1',
      email: 'alice@example.com',
      displayName: 'Alice',
    },
    series: {
      title: 'Weekly Planning Meeting',
      cancelledAt: null,
    },
  };

  beforeEach(() => {
    prisma = {
      appointment: {
        findUnique: jest.fn(),
      },
    };

    emailService = {
      sendReminderEmail: jest.fn(),
    };

    notificationService = {
      sendAndCreateNotification: jest.fn(),
    };

    processor = new ReminderProcessor(
      prisma as never,
      emailService as never,
      notificationService as never,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('UTCID01 should process valid reminder and send email plus notification', async () => {
    prisma.appointment.findUnique.mockResolvedValue(baseAppointment);
    emailService.sendReminderEmail.mockResolvedValue(undefined);
    notificationService.sendAndCreateNotification.mockResolvedValue(undefined);

    await expect(
      processor.process({
        id: 'j-1',
        data: { appointmentId },
      } as never),
    ).resolves.toBeUndefined();

    expect(emailService.sendReminderEmail).toHaveBeenCalledWith({
      to: 'alice@example.com',
      displayName: 'Alice',
      appointmentTitle: 'Weekly Planning Meeting',
      startAt: new Date('2026-05-20T09:00:00.000Z'),
    });

    expect(notificationService.sendAndCreateNotification).toHaveBeenCalledWith({
      userId: 'u-1',
      eventType: NotificationEventType.REMINDER_TRIGGERED,
      appointmentId,
      title: 'Appointment reminder',
      body: "You have a scheduled appointment 'Weekly Planning Meeting' at 2026-05-20T09:00:00.000Z",
      type: NotificationType.REMINDER,
      payload: {
        appointmentTitle: 'Weekly Planning Meeting',
      },
    });
  });

  it('UTCID02 should skip processing when appointment is missing', async () => {
    prisma.appointment.findUnique.mockResolvedValue(null);

    await expect(
      processor.process({
        id: 'j-2',
        data: { appointmentId },
      } as never),
    ).resolves.toBeUndefined();

    expect(emailService.sendReminderEmail).not.toHaveBeenCalled();
    expect(
      notificationService.sendAndCreateNotification,
    ).not.toHaveBeenCalled();
  });

  it('UTCID03 should skip processing when appointment series is cancelled', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      ...baseAppointment,
      series: {
        title: 'Weekly Planning Meeting',
        cancelledAt: new Date('2026-05-18T08:00:00.000Z'),
      },
    });

    await expect(
      processor.process({
        id: 'j-3',
        data: { appointmentId },
      } as never),
    ).resolves.toBeUndefined();

    expect(emailService.sendReminderEmail).not.toHaveBeenCalled();
    expect(
      notificationService.sendAndCreateNotification,
    ).not.toHaveBeenCalled();
  });

  it('UTCID04 should continue when email fails and notification succeeds', async () => {
    prisma.appointment.findUnique.mockResolvedValue(baseAppointment);
    emailService.sendReminderEmail.mockRejectedValue(new Error('SMTP timeout'));
    notificationService.sendAndCreateNotification.mockResolvedValue(undefined);

    const errorSpy = jest
      .spyOn((processor as any).logger, 'error')
      .mockImplementation(() => undefined);

    await expect(
      processor.process({
        id: 'j-4',
        data: { appointmentId },
      } as never),
    ).resolves.toBeUndefined();

    expect(emailService.sendReminderEmail).toHaveBeenCalledTimes(1);
    expect(notificationService.sendAndCreateNotification).toHaveBeenCalledTimes(
      1,
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it('UTCID05 should continue when notification fails and email succeeds', async () => {
    prisma.appointment.findUnique.mockResolvedValue(baseAppointment);
    emailService.sendReminderEmail.mockResolvedValue(undefined);
    notificationService.sendAndCreateNotification.mockRejectedValue(
      new Error('DB write failure'),
    );

    const errorSpy = jest
      .spyOn((processor as any).logger, 'error')
      .mockImplementation(() => undefined);

    await expect(
      processor.process({
        id: 'j-5',
        data: { appointmentId },
      } as never),
    ).resolves.toBeUndefined();

    expect(emailService.sendReminderEmail).toHaveBeenCalledTimes(1);
    expect(notificationService.sendAndCreateNotification).toHaveBeenCalledTimes(
      1,
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it('UTCID06 should continue when both email and notification fail', async () => {
    prisma.appointment.findUnique.mockResolvedValue(baseAppointment);
    emailService.sendReminderEmail.mockRejectedValue(new Error('SMTP timeout'));
    notificationService.sendAndCreateNotification.mockRejectedValue(
      new Error('DB write failure'),
    );

    const errorSpy = jest
      .spyOn((processor as any).logger, 'error')
      .mockImplementation(() => undefined);

    await expect(
      processor.process({
        id: 'j-6',
        data: { appointmentId },
      } as never),
    ).resolves.toBeUndefined();

    expect(emailService.sendReminderEmail).toHaveBeenCalledTimes(1);
    expect(notificationService.sendAndCreateNotification).toHaveBeenCalledTimes(
      1,
    );
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
