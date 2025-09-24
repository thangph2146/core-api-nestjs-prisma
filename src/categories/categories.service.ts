import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';

@Injectable()
export class CategoriesService extends BaseService<Category, CreateCategoryDto, UpdateCategoryDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'category',
      searchFields: ['name', 'description', 'slug'],
      defaultOrderBy: { name: 'asc' },
      columnFilterConfig: {
        name: { type: 'text' },
        description: { type: 'text' },
        slug: { type: 'text' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<Category[]> {
    const { skip, take, where, orderBy, includeDeleted, search, columnFilters } = params || {};

    // Build where conditions
    const whereConditions: Prisma.CategoryWhereInput = {
      ...where,
    };

    // Apply column filter conditions
    if (columnFilters) {
      const columnFilterConditions = this.buildColumnFilterConditions(columnFilters);
      Object.assign(whereConditions, columnFilterConditions);
    }

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(search, [
      'name',
      'description',
      'slug',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('category', {
      skip,
      take,
      where: whereConditions,
      orderBy,
      include: {
        posts: {
          include: {
            post: true,
          },
        },
      },
      includeDeleted,
    });
  }

  async findOne(
    id: string,
    includeDeleted: boolean = false,
  ): Promise<Category> {
    try {
      return await this.findUnique(
        'category',
        { id },
        {
          posts: {
            include: {
              post: {
                include: {
                  author: true,
                },
              },
            },
          },
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        posts: {
          include: {
            post: {
              include: {
                author: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.findOne(id); // Check if category exists
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  // Soft delete
  async remove(id: string): Promise<Category> {
    await this.findOne(id); // Check if category exists
    return this.softDelete('category', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<Category> {
    await this.findOne(id);
    return this.hardDeleteRecord('category', id);
  }

  // Restore
  async restore(id: string): Promise<Category> {
    return this.restoreRecord('category', id);
  }

  // Bulk operations

  // Get deleted categories
  async findDeleted(params?: { search?: string }): Promise<Category[]> {
    const whereConditions: Prisma.CategoryWhereInput = {
      deletedAt: { not: null },
    };

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(params?.search, [
      'name',
      'description',
      'slug',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('category', {
      where: whereConditions,
      include: {
        posts: {
          include: {
            post: true,
          },
        },
      },
      includeDeleted: true,
    });
  }
}
