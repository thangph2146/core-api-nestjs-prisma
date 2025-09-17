import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  // Get public posts - only published and not deleted
  async getPublicPosts(params?: {
    skip?: number;
    take?: number;
    authorId?: string;
    categoryId?: string;
    tagId?: string;
    search?: string;
    orderBy?: 'newest' | 'oldest' | 'popular';
  }) {
    const { skip, take, authorId, categoryId, tagId, search, orderBy } = params || {};

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

    // Add search filter
    if (search && search.trim()) {
      whereConditions.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { excerpt: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Build order by
    let orderByClause: Prisma.PostOrderByWithRelationInput = { publishedAt: 'desc' };
    if (orderBy === 'oldest') {
      orderByClause = { publishedAt: 'asc' };
    } else if (orderBy === 'popular') {
      orderByClause = { comments: { _count: 'desc' } };
    }

    return this.prisma.post.findMany({
      skip,
      take,
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
            comments: {
              where: {
                approved: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });
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
      throw new Error(`Post with slug ${slug} not found`);
    }

    return post;
  }

  // Get public categories
  async getPublicCategories(params?: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const { skip, take, search } = params || {};

    const whereConditions: Prisma.CategoryWhereInput = {
      deletedAt: null,
    };

    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.category.findMany({
      skip,
      take,
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
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const { skip, take, search } = params || {};

    const whereConditions: Prisma.TagWhereInput = {
      deletedAt: null,
    };

    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.tag.findMany({
      skip,
      take,
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
  async getPublicComments(postId: string, params?: {
    skip?: number;
    take?: number;
  }) {
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
    skip?: number;
    take?: number;
  }) {
    const { q, type = 'all', skip, take } = params;

    if (!q || !q.trim()) {
      return { posts: [], categories: [], tags: [] };
    }

    const searchTerm = q.trim();
    const results: any = { posts: [], categories: [], tags: [] };

    if (type === 'all' || type === 'posts') {
      results.posts = await this.prisma.post.findMany({
        skip,
        take,
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
        take,
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
        take,
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
}
