import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationService } from './notification.service';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [PrismaModule, UserModule],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {

}
