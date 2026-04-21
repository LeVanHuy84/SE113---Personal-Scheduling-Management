import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDeviceRequestDto } from './dto/user-device-request.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findProfileById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; timezone?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async registerDevice(userId, data: UserDeviceRequestDto) {
    return this.prisma.userDevice.upsert({
      where: { fcmToken: data.fcmToken },
      update: {
        userId: userId,
        deviceName: data.deviceName,
        platform: data.platform,
      },
      create: {
        userId: userId,
        fcmToken: data.fcmToken,
        deviceName: data.deviceName,
        platform: data.platform,
      },
      select: {
        id: true,
        userId: true,
        fcmToken: true,
        deviceName: true,
        platform: true,
      }
    })
  }

  async getUserDevices(userId) {
    return this.prisma.userDevice.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        fcmToken: true,
        deviceName: true,
        platform: true,
      }
    });

  }

  async removeDevice(fcmToken: string) {
    return this.prisma.userDevice.delete({
      where: { fcmToken },
    });
  }
}
