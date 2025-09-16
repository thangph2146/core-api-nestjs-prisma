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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.categoriesService.findAll(query);
  }

  @Get('deleted')
  findDeleted(@Query() query: any) {
    return this.categoriesService.findDeleted(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.categoriesService.hardDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.categoriesService.restore(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.categoriesService.bulkDelete(bulkDeleteDto);
  }

  @Post('bulk-restore')
  bulkRestore(@Body() bulkRestoreDto: BulkRestoreDto) {
    return this.categoriesService.bulkRestore(bulkRestoreDto);
  }

  @Post('bulk-hard-delete')
  bulkHardDelete(@Body() bulkHardDeleteDto: BulkHardDeleteDto) {
    return this.categoriesService.bulkHardDelete(bulkHardDeleteDto);
  }
}
