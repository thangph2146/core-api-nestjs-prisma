import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag, Prisma } from '@prisma/client';
import { BaseService } from '../../common/base.service';

@Injectable()
export class TagsService extends BaseService<Tag, CreateTagDto, UpdateTagDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'tag',
      searchFields: ['name', 'slug'],
      defaultInclude: {}, // Bỏ include posts để tránh circular reference
      defaultOrderBy: { name: 'asc' },
      columnFilterConfig: {
        name: { type: 'text' },
        slug: { type: 'text' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    return this.prisma.tag.create({
      data: createTagDto,
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TagWhereUniqueInput;
    where?: Prisma.TagWhereInput;
    orderBy?: Prisma.TagOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<Tag[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    // Use the new paginated method for consistency
    const result = await this.findManyPaginatedWithFilters('tag', {
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      limit: take || 10,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    });

    return result.items;
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<Tag> {
    try {
      return await this.findUnique(
        'tag',
        { id },
        {}, // Bỏ include posts để tránh circular reference
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      // Bỏ include posts để tránh circular reference
    });

    if (!tag) {
      throw new NotFoundException(`Tag with slug ${slug} not found`);
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    await this.findOne(id); // Check if tag exists
    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  // Soft delete
  async remove(id: string): Promise<Tag> {
    await this.findOne(id); // Check if tag exists
    return this.softDelete('tag', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<Tag> {
    await this.findOne(id);
    return this.hardDeleteRecord('tag', id);
  }

  // Restore
  async restore(id: string): Promise<Tag> {
    return this.restoreRecord('tag', id);
  }

  // Bulk operations

  // Get deleted tags
  async findDeleted(params?: {
    search?: string;
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Tag[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('tag', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}
