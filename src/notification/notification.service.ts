import { Injectable } from '@nestjs/common';
import { NotificationType, NotificationEventType } from '@prisma/client';
import { UserDeviceService } from 'src/device/user-device.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
    private userDeviceService: UserDeviceService,
  ) {}

  async sendAndCreateNotification(input: {
    userId: string;
    actorUserId?: string;
    appointmentId?: string;
    teamInvitationId?: string;
    teamAppointmentId?: string;
    type: NotificationType;
    eventType?: NotificationEventType;
    title?: string;
    body: string;
    payload?: any;
    pushData?: Record<string, string>;
  }) {
    const {
      userId,
      actorUserId,
      appointmentId,
      teamInvitationId,
      teamAppointmentId,
      type,
      eventType,
      title,
      body,
      payload,
      pushData,
    } = input;

    // 1. get user devices
    const devices = await this.userDeviceService.getUserDevices(userId);
    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);

    const pushPayload = {
      appointmentId,
      teamInvitationId,
      teamAppointmentId,
      ...pushData,
    } as Record<string, string>;

    // 2. push + persist
    const ops = [] as Promise<any>[];

    if (tokens.length > 0) {
      ops.push(
        this.firebaseService.sendToDevices({
          tokens,
          title: title ?? 'Notification',
          body,
          data: pushPayload,
        }),
      );
    }

    ops.push(
      this.prisma.notification.create({
        data: {
          userId,
          actorUserId: actorUserId ?? undefined,
          appointmentId: appointmentId ?? undefined,
          teamInvitationId: teamInvitationId ?? undefined,
          teamAppointmentId: teamAppointmentId ?? undefined,
          type,
          eventType: eventType ?? undefined,
          title: title ?? null,
          message: body,
          payload: payload ?? undefined,
        },
      }),
    );

    await Promise.all(ops);
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
