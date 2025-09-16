import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Injectable()
export class PostsService extends BaseService<Post> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { categoryIds, tagIds, ...postData } = createPostDto;

    return this.prisma.post.create({
      data: {
        ...postData,
        publishedAt: createPostDto.published ? new Date() : null,
        categories: categoryIds ? {
          create: categoryIds.map(categoryId => ({
            category: { connect: { id: categoryId } }
          }))
        } : undefined,
        tags: tagIds ? {
          create: tagIds.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        } : undefined,
      },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted, search } = params || {};
    
    // Build where conditions
    const whereConditions: Prisma.PostWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Add search conditions if search parameter is provided
    if (search && search.trim()) {
      whereConditions.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' as const } },
        { excerpt: { contains: search.trim(), mode: 'insensitive' as const } },
        { slug: { contains: search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where: whereConditions,
      orderBy,
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: true,
      },
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (!includeDeleted && (post as any).deletedAt) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
          where: {
            approved: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    await this.findOne(id); // Check if post exists

    const { categoryIds, tagIds, ...postData } = updatePostDto;

    // Handle categories and tags updates
    if (categoryIds !== undefined) {
      await this.prisma.postCategory.deleteMany({
        where: { postId: id },
      });
    }

    if (tagIds !== undefined) {
      await this.prisma.postTag.deleteMany({
        where: { postId: id },
      });
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        publishedAt: updatePostDto.published ? new Date() : undefined,
        categories: categoryIds ? {
          create: categoryIds.map(categoryId => ({
            category: { connect: { id: categoryId } }
          }))
        } : undefined,
        tags: tagIds ? {
          create: tagIds.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        } : undefined,
      },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: true,
      },
    });
  }


  async publish(id: string): Promise<Post> {
    return this.update(id, { published: true });
  }

  async unpublish(id: string): Promise<Post> {
    return this.update(id, { published: false });
  }

  // Soft delete
  async remove(id: string): Promise<Post> {
    await this.findOne(id); // Check if post exists
    return this.softDelete('post', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<Post> {
    await this.findOne(id); // Check if post exists
    return this.hardDeleteRecord('post', id);
  }

  // Restore
  async restore(id: string): Promise<Post> {
    return this.restoreRecord('post', id);
  }

  // Bulk operations
  async bulkDelete(bulkDeleteDto: BulkDeleteDto): Promise<{ count: number }> {
    return this.bulkSoftDelete('post', bulkDeleteDto.ids);
  }

  async bulkRestore(bulkRestoreDto: BulkRestoreDto): Promise<{ count: number }> {
    return this.bulkRestoreRecords('post', bulkRestoreDto.ids);
  }

  async bulkHardDelete(bulkHardDeleteDto: BulkHardDeleteDto): Promise<{ count: number }> {
    return this.bulkHardDeleteRecords('post', bulkHardDeleteDto.ids);
  }

  // Get deleted posts
  async findDeleted(params?: { search?: string }): Promise<Post[]> {
    const whereConditions: any = { deletedAt: { not: null } };
    
    // Add search conditions if search parameter is provided
    if (params?.search && params.search.trim()) {
      whereConditions.OR = [
        { title: { contains: params.search.trim(), mode: 'insensitive' as const } },
        { excerpt: { contains: params.search.trim(), mode: 'insensitive' as const } },
        { slug: { contains: params.search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.post.findMany({
      where: whereConditions,
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: true,
      },
    });
  }
}
