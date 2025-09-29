import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, Prisma } from '@prisma/client';
import { BaseService } from '../../common/base.service';

@Injectable()
export class CategoriesService extends BaseService<Category, CreateCategoryDto, UpdateCategoryDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'category',
      searchFields: ['name', 'description', 'slug'],
      defaultInclude: {
        posts: {
          include: {
            post: true,
          },
        },
      },
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
    // Use the new paginated method for consistency
    const result = await this.findManyPaginatedWithFilters('category', {
      page: params?.skip ? Math.floor(params.skip / (params.take || 10)) + 1 : 1,
      limit: params?.take || 10,
      where: params?.where,
      orderBy: params?.orderBy,
      includeDeleted: params?.includeDeleted,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
    
    return result.items;
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
  async findDeleted(params?: { 
    search?: string; 
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('category', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}
