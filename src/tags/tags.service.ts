import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Injectable()
export class TagsService extends BaseService<Tag> {
  constructor(prisma: PrismaService) {
    super(prisma);
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
  }): Promise<Tag[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted, search } = params || {};
    
    // Build where conditions
    const whereConditions: Prisma.TagWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Add search conditions if search parameter is provided
    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        { slug: { contains: search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.tag.findMany({
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

  async findOne(id: string, includeDeleted: boolean = false): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({
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

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    if (!includeDeleted && (tag as any).deletedAt) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag;
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({
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
  async bulkDelete(bulkDeleteDto: BulkDeleteDto): Promise<{ count: number }> {
    return this.bulkSoftDelete('tag', bulkDeleteDto.ids);
  }

  async bulkRestore(bulkRestoreDto: BulkRestoreDto): Promise<{ count: number }> {
    return this.bulkRestoreRecords('tag', bulkRestoreDto.ids);
  }

  async bulkHardDelete(bulkHardDeleteDto: BulkHardDeleteDto): Promise<{ count: number }> {
    return this.bulkHardDeleteRecords('tag', bulkHardDeleteDto.ids);
  }

  // Get deleted tags
  async findDeleted(params?: { search?: string }): Promise<Tag[]> {
    const whereConditions: any = { deletedAt: { not: null } };
    
    // Add search conditions if search parameter is provided
    if (params?.search && params.search.trim()) {
      whereConditions.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' as const } },
        { slug: { contains: params.search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.tag.findMany({
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
