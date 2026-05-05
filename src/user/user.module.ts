import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { NotificationModule } from 'src/notification/notification.module';
import { UserDeviceModule } from 'src/device/user-device.module';

@Module({
  imports: [AuthModule, PrismaModule, NotificationModule, UserDeviceModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserService]
})
export class UserModule {}
