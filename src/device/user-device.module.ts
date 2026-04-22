import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserDeviceService } from './user-device.service';

@Module({
  imports: [PrismaModule],
  providers: [UserDeviceService],
  exports: [UserDeviceService]
})
export class UserDeviceModule { }
