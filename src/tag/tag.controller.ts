import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPrincipal } from '../auth/interfaces/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTagRequestDto } from './dto/create-tag-request.dto';
import { TagIdParamsDto } from './dto/tag-id-params.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { UpdateTagRequestDto } from './dto/update-tag-request.dto';
import { TagService } from './tag.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTag(
    @CurrentUser() user: CurrentUserPrincipal,
    @Body() dto: CreateTagRequestDto,
  ): Promise<TagResponseDto> {
    return this.tagService.createTag(user.userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getTags(@CurrentUser() user: CurrentUserPrincipal): Promise<TagResponseDto[]> {
    return this.tagService.getTags(user.userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getTagById(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TagIdParamsDto,
  ): Promise<TagResponseDto> {
    return this.tagService.getTagById(user.userId, params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateTag(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TagIdParamsDto,
    @Body() dto: UpdateTagRequestDto,
  ): Promise<TagResponseDto> {
    return this.tagService.updateTag(user.userId, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteTag(
    @CurrentUser() user: CurrentUserPrincipal,
    @Param() params: TagIdParamsDto,
  ): Promise<{ message: string }> {
    return this.tagService.deleteTag(user.userId, params.id);
  }
}
