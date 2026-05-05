import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDeviceRequestDto } from './dto/user-device-request.dto';

@Injectable()
export class UserDeviceService {
  constructor(private readonly prisma: PrismaService) {}

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
