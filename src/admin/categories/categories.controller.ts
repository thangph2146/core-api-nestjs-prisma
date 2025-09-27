import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BaseController } from '../../common/base.controller';
import { Category } from '@prisma/client';

@Controller('categories')
export class CategoriesController extends BaseController<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor(private readonly categoriesService: CategoriesService) {
    super(categoriesService, {
      modelName: 'category',
      createDto: CreateCategoryDto,
      updateDto: UpdateCategoryDto,
      includeSlug: true,
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
