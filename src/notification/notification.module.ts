import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationService } from './notification.service';
import { UserModule } from 'src/user/user.module';
import { UserDeviceModule } from 'src/device/user-device.module';

@Module({
    imports: [PrismaModule, UserDeviceModule],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {

}
