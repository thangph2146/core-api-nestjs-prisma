import { Controller, Get, Param } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { BaseController } from '../../common/base.controller';
import { Tag } from '@prisma/client';

@Controller('tags')
export class TagsController extends BaseController<
  Tag,
  CreateTagDto,
  UpdateTagDto
> {
  constructor(private readonly tagsService: TagsService) {
    super(tagsService, {
      modelName: 'tag',
      createDto: CreateTagDto,
      updateDto: UpdateTagDto,
      includeSlug: true,
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }
}
