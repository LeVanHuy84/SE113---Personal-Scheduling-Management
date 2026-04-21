import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(entity: {
    id: string;
    name: string;
    color: string | null;
  }): TagResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      color: entity.color,
    };
  }

  async create(input: {
    userId: string;
    name: string;
    color: string | null;
  }): Promise<TagResponseDto> {
    const created = await this.prisma.tag.create({
      data: {
        userId: input.userId,
        name: input.name,
        color: input.color,
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    return this.toDto(created);
  }

  async findManyByUserId(userId: string): Promise<TagResponseDto[]> {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    return tags.map((tag) => this.toDto(tag));
  }

  async findByIdAndUserId(id: string, userId: string): Promise<TagResponseDto | null> {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    return tag ? this.toDto(tag) : null;
  }

  async update(input: {
    id: string;
    data: {
      name?: string;
      color?: string;
    };
  }): Promise<TagResponseDto> {
    const updated = await this.prisma.tag.update({
      where: {
        id: input.id,
      },
      data: input.data,
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    return this.toDto(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.delete({
      where: { id },
    });
  }

  async existsByName(input: {
    userId: string;
    name: string;
    excludeTagId?: string;
  }): Promise<boolean> {
    const where: Prisma.TagWhereInput = {
      userId: input.userId,
      name: {
        equals: input.name,
        mode: 'insensitive',
      },
    };

    if (input.excludeTagId) {
      where.id = { not: input.excludeTagId };
    }

    const count = await this.prisma.tag.count({ where });
    return count > 0;
  }

  async findExistingTagIds(tagIds: string[]): Promise<string[]> {
    if (!tagIds || tagIds.length === 0) return [];

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    });

    return tags.map((tag) => tag.id);
  }

  async allTagIdsExist(tagIds: string[]): Promise<boolean> {
    if (!tagIds || tagIds.length === 0) return true;

    const count = await this.prisma.tag.count({
      where: { id: { in: tagIds } },
    });

    return count === tagIds.length;
  }
}