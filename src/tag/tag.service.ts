import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagRequestDto } from './dto/create-tag-request.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { UpdateTagRequestDto } from './dto/update-tag-request.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async createTag(
    userId: string,
    dto: CreateTagRequestDto,
  ): Promise<TagResponseDto> {
    const normalizedName = dto.name.trim();
    await this.ensureNameUnique(userId, normalizedName);

    return this.tagRepository.create({
      userId,
      name: normalizedName,
      color: dto.color ?? null,
    });
  }

  async getTags(userId: string): Promise<TagResponseDto[]> {
    return this.tagRepository.findManyByUserId(userId);
  }

  async getTagById(userId: string, id: string): Promise<TagResponseDto> {
    const tag = await this.tagRepository.findByIdAndUserId(id, userId);
    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    return tag;
  }

  async updateTag(
    userId: string,
    id: string,
    dto: UpdateTagRequestDto,
  ): Promise<TagResponseDto> {
    const existingTag = await this.tagRepository.findByIdAndUserId(id, userId);
    if (!existingTag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    const nextName = dto.name?.trim();
    if (nextName) {
      await this.ensureNameUnique(userId, nextName, id);
    }

    return this.tagRepository.update({
      id,
      data: {
        name: nextName,
        color: dto.color,
      },
    });
  }

  async deleteTag(userId: string, id: string): Promise<{ message: string }> {
    const existingTag = await this.tagRepository.findByIdAndUserId(id, userId);
    if (!existingTag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    await this.tagRepository.delete(id);
    return { message: 'Delete tag successfully!' };
  }

  private async ensureNameUnique(
    userId: string,
    name: string,
    excludeTagId?: string,
  ): Promise<void> {
    const exists = await this.tagRepository.existsByName({
      userId,
      name,
      excludeTagId,
    });

    if (exists) {
      throw new ConflictException('Tag name already exists');
    }
  }
}
