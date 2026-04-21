import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { FirebaseService } from "src/firebase/firebase.service";
import { PrismaService } from "src/prisma/prisma.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
    private userDeviceService: UserService,
  ) { }

  async sendAndCreateNotification(input: {
    appointment: {
      id: string;
      userId: string;
      startAt: Date;
    };
    title: string;
    body: string;
    type: string;
    data?: Record<string, string>;
  }) {
    const { appointment } = input;

    // 1. Lấy tokens
    const devices = await this.userDeviceService.getUserDevices(
      appointment.userId,
    );

    const tokens = devices.map((d) => d.fcmToken);

    const notificationData = {
      appointmentId: appointment.id,
      ...input.data,
    };

    // 2. chạy song song (push + DB)
    await Promise.all([
      this.firebaseService.sendToDevices({
        tokens,
        title: input.title,
        body: input.body,
        data: notificationData,
      }),

      this.prisma.notification.create({
        data: {
          userId: appointment.userId,
          appointmentId: appointment.id,
          type: NotificationType.REMINDER,
          message: input.body,
          triggeredAt: appointment.startAt,
        },
      }),
    ]);
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