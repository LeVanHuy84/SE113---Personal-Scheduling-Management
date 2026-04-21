import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TagController } from './tag.controller';
import { TagRepository } from './tag.repository';
import { TagService } from './tag.service';

@Module({
  imports: [PrismaModule],
  controllers: [TagController],
  providers: [TagRepository, TagService],
  exports: [TagRepository, TagService],
})
export class TagModule {}
