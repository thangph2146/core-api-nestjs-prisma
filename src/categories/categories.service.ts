import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Injectable()
export class CategoriesService extends BaseService<Category> {
  constructor(prisma: PrismaService) {
    super(prisma);
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
  }): Promise<Category[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted, search } = params || {};
    
    // Build where conditions
    const whereConditions: Prisma.CategoryWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Add search conditions if search parameter is provided
    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        { description: { contains: search.trim(), mode: 'insensitive' as const } },
        { slug: { contains: search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.category.findMany({
      skip,
      take,
      cursor,
      where: whereConditions,
      orderBy,
      include: {
        posts: {
          include: {
            post: true,
          },
        },
      },
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
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
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (!includeDeleted && (category as any).deletedAt) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
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

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
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
  async bulkDelete(bulkDeleteDto: BulkDeleteDto): Promise<{ count: number }> {
    return this.bulkSoftDelete('category', bulkDeleteDto.ids);
  }

  async bulkRestore(bulkRestoreDto: BulkRestoreDto): Promise<{ count: number }> {
    return this.bulkRestoreRecords('category', bulkRestoreDto.ids);
  }

  async bulkHardDelete(bulkHardDeleteDto: BulkHardDeleteDto): Promise<{ count: number }> {
    return this.bulkHardDeleteRecords('category', bulkHardDeleteDto.ids);
  }

  // Get deleted categories
  async findDeleted(params?: { search?: string }): Promise<Category[]> {
    const whereConditions: any = { deletedAt: { not: null } };
    
    // Add search conditions if search parameter is provided
    if (params?.search && params.search.trim()) {
      whereConditions.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' as const } },
        { description: { contains: params.search.trim(), mode: 'insensitive' as const } },
        { slug: { contains: params.search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.category.findMany({
      where: whereConditions,
      include: {
        posts: {
          include: {
            post: true,
          },
        },
      },
    });
  }
}
