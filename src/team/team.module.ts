import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { TeamController } from './team.controller';
import { TeamRepository } from './team.repository';
import { TeamService } from './team.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [TeamController],
  providers: [TeamRepository, TeamService],
  exports: [TeamRepository, TeamService],
})
export class TeamModule {}
