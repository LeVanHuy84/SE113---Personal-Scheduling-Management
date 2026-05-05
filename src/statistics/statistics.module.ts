import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsRepository } from './statistics.repository';

@Module({
  providers: [StatisticsService, StatisticsRepository, PrismaService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}
