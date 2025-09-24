import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';

@Injectable()
export class PostsService extends BaseService<Post, CreatePostDto, UpdatePostDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'post',
      searchFields: ['title', 'excerpt', 'content', 'slug'],
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        title: { type: 'text' },
        excerpt: { type: 'text' },
        slug: { type: 'text' },
        published: { type: 'boolean' },
        status: { type: 'boolean', field: 'published' },
        author: { 
          type: 'nested', 
          field: 'author',
          nestedFields: ['name', 'email'] 
        },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        publishedAt: { type: 'date' },
        authorId: { type: 'text' },
        categoryId: { type: 'text' },
        tagId: { type: 'text' },
      },
    });
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { categoryIds, tagIds, ...postData } = createPostDto;

    return this.prisma.post.create({
      data: {
        ...postData,
        publishedAt: createPostDto.published ? new Date() : null,
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
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
    published?: boolean | string;
    columnFilters?: Record<string, string>;
  }): Promise<Post[]> {
    const {
      skip,
      take,
      cursor,
      where,
      orderBy,
      includeDeleted,
      search,
      published,
      columnFilters,
    } = params || {};

    // Convert published string to boolean
    const publishedBool =
      published === 'true' ? true : published === 'false' ? false : published;

    // Build where conditions
    const whereConditions: Prisma.PostWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(publishedBool !== undefined && typeof publishedBool === 'boolean'
        ? { published: publishedBool }
        : {}),
    };

    // Add column filter conditions if provided
    if (columnFilters) {
      const columnFilterConditions =
        this.buildColumnFilterConditions(columnFilters);
      Object.assign(whereConditions, columnFilterConditions);
    }

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(search, [
      'title',
      'excerpt',
      'slug',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
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

  // Optimized method for blog listing - only returns necessary data
  async findForBlog(params?: {
    skip?: number;
    take?: number;
    published?: boolean | string;
    authorId?: string;
    categoryId?: string;
    tagId?: string;
    search?: string;
  }): Promise<any[]> {
    const { skip, take, published, authorId, categoryId, tagId, search } =
      params || {};

    // Convert published string to boolean
    const publishedBool =
      published === 'true' ? true : published === 'false' ? false : published;

    // Build where conditions
    const whereConditions: Prisma.PostWhereInput = {
      deletedAt: null, // Always exclude deleted posts for blog
      ...(publishedBool !== undefined && typeof publishedBool === 'boolean'
        ? { published: publishedBool }
        : { published: true }), // Default to published only
      ...(authorId ? { authorId } : {}),
    };

    // Add category filter
    if (categoryId) {
      whereConditions.categories = {
        some: {
          categoryId,
        },
      };
    }

    // Add tag filter
    if (tagId) {
      whereConditions.tags = {
        some: {
          tagId,
        },
      };
    }

    // Add search conditions
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
      where: whereConditions,
      orderBy: { publishedAt: 'desc' }, // Latest first
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        image: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        // Don't include content and comments for blog listing
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

    if (!includeDeleted && post.deletedAt) {
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
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
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

  // Get deleted posts
  async findDeleted(params?: { search?: string }): Promise<Post[]> {
    const whereConditions: Prisma.PostWhereInput = { deletedAt: { not: null } };

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(params?.search, [
      'title',
      'excerpt',
      'slug',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
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
