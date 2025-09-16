import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.tagsService.findAll(query);
  }

  @Get('deleted')
  findDeleted(@Query() query: any) {
    return this.tagsService.findDeleted(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.tagsService.hardDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.tagsService.restore(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.tagsService.bulkDelete(bulkDeleteDto);
  }

  @Post('bulk-restore')
  bulkRestore(@Body() bulkRestoreDto: BulkRestoreDto) {
    return this.tagsService.bulkRestore(bulkRestoreDto);
  }

  @Post('bulk-hard-delete')
  bulkHardDelete(@Body() bulkHardDeleteDto: BulkHardDeleteDto) {
    return this.tagsService.bulkHardDelete(bulkHardDeleteDto);
  }
}
