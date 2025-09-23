import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  // Get public posts - only published and not deleted
  async getPublicPosts(params?: {
    page?: number | string;
    limit?: number | string;
    authorId?: string;
    categoryId?: string;
    tagId?: string;
    search?: string;
    orderBy?: 'newest' | 'oldest' | 'popular';
  }) {
    const {
      page = 1,
      limit = 10,
      authorId,
      categoryId,
      tagId,
      search,
      orderBy = 'newest',
    } = params || {};

    // Convert string parameters to numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const skip = (pageNum - 1) * limitNum;

    // Build where conditions for public posts
    const whereConditions: Prisma.PostWhereInput = {
      deletedAt: null,
      published: true,
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

    // Add search filter with optimized search
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereConditions.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        // Search in categories
        {
          categories: {
            some: {
              category: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        },
        // Search in tags
        {
          tags: {
            some: {
              tag: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    // Build order by
    let orderByClause: Prisma.PostOrderByWithRelationInput = {
      publishedAt: 'desc',
    };
    if (orderBy === 'oldest') {
      orderByClause = { publishedAt: 'asc' };
    } else if (orderBy === 'popular') {
      orderByClause = { createdAt: 'desc' }; // Fallback to createdAt for popular
    }

    // Get total count for pagination
    const total = await this.prisma.post.count({
      where: whereConditions,
    });

    // Get posts with pagination
    const posts = await this.prisma.post.findMany({
      skip,
      take: limitNum,
      where: whereConditions,
      orderBy: orderByClause,
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        image: true,
        publishedAt: true,
        createdAt: true,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return {
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  // Get public post by slug
  async getPublicPostBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        deletedAt: null,
        published: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        image: true,
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
                description: true,
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
        comments: {
          where: {
            approved: true,
            deletedAt: null,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }

    return post;
  }

  // Get public categories
  async getPublicCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.CategoryWhereInput = {
      deletedAt: null,
    };

    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.category.count({
      where: whereConditions,
    });

    // Get categories with pagination
    const categories = await this.prisma.category.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  published: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  // Get public category by slug
  async getPublicCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        posts: {
          where: {
            post: {
              published: true,
              deletedAt: null,
            },
          },
          select: {
            post: {
              select: {
                id: true,
                title: true,
                excerpt: true,
                slug: true,
                image: true,
                publishedAt: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            post: {
              publishedAt: 'desc',
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error(`Category with slug ${slug} not found`);
    }

    return category;
  }

  // Get public tags
  async getPublicTags(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.TagWhereInput = {
      deletedAt: null,
    };

    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.tag.count({
      where: whereConditions,
    });

    // Get tags with pagination
    const tags = await this.prisma.tag.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  published: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: tags,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  // Get public tag by slug
  async getPublicTagBySlug(slug: string) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        posts: {
          where: {
            post: {
              published: true,
              deletedAt: null,
            },
          },
          select: {
            post: {
              select: {
                id: true,
                title: true,
                excerpt: true,
                slug: true,
                image: true,
                publishedAt: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            post: {
              publishedAt: 'desc',
            },
          },
        },
      },
    });

    if (!tag) {
      throw new Error(`Tag with slug ${slug} not found`);
    }

    return tag;
  }

  // Get public comments for a post
  async getPublicComments(
    postId: string,
    params?: {
      skip?: number;
      take?: number;
    },
  ) {
    const { skip, take } = params || {};

    return this.prisma.comment.findMany({
      skip,
      take,
      where: {
        postId,
        approved: true,
        deletedAt: null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Search public content
  async searchPublicContent(params: {
    q: string;
    type?: 'posts' | 'categories' | 'tags' | 'all';
    page?: number;
    limit?: number;
  }) {
    const { q, type = 'all', page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    if (!q || !q.trim()) {
      return { posts: [], categories: [], tags: [] };
    }

    const searchTerm = q.trim();
    const results: {
      posts: any[];
      categories: any[];
      tags: any[];
    } = { posts: [], categories: [], tags: [] };

    if (type === 'all' || type === 'posts') {
      results.posts = await this.prisma.post.findMany({
        skip,
        take: limit,
        where: {
          deletedAt: null,
          published: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          slug: true,
          image: true,
          publishedAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
    }

    if (type === 'all' || type === 'categories') {
      results.categories = await this.prisma.category.findMany({
        skip,
        take: limit,
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    if (type === 'all' || type === 'tags') {
      results.tags = await this.prisma.tag.findMany({
        skip,
        take: limit,
        where: {
          deletedAt: null,
          name: { contains: searchTerm, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return results;
  }

  // Get related posts based on categories and tags
  async getRelatedPosts(postId: string, limit: number = 5) {
    // First, get the current post to find its categories and tags
    const currentPost = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
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
      },
    });

    if (!currentPost) {
      return [];
    }

    const categoryIds = currentPost.categories.map((pc) => pc.categoryId);
    const tagIds = currentPost.tags.map((pt) => pt.tagId);

    // Find related posts based on shared categories or tags
    const relatedPosts = await this.prisma.post.findMany({
      where: {
        AND: [
          { id: { not: postId } }, // Exclude current post
          { published: true }, // Only published posts
          { deletedAt: null }, // Not deleted
          {
            OR: [
              // Posts with same categories
              {
                categories: {
                  some: {
                    categoryId: { in: categoryIds },
                  },
                },
              },
              // Posts with same tags
              {
                tags: {
                  some: {
                    tagId: { in: tagIds },
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
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
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                approved: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    return relatedPosts;
  }
}
