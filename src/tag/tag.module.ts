import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TagRepository } from './tag.repository';

@Module({
    imports: [PrismaModule],
    controllers: [],
    providers: [TagRepository],
    exports: [TagRepository]
})
export class TagModule { }
