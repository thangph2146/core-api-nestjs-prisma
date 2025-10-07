import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface DashboardStats {
  posts: {
    total: number;
    published: number;
    drafts: number;
  };
  comments: {
    total: number;
    pending: number;
  };
  users: {
    total: number;
  };
  categories: {
    total: number;
  };
  tags: {
    total: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        totalPosts,
        publishedPosts,
        draftPosts,
        totalComments,
        pendingComments,
        totalUsers,
        totalCategories,
        totalTags,
      ] = await Promise.all([
        this.prisma.post.count({ where: { deletedAt: null } }),
        this.prisma.post.count({ where: { published: true, deletedAt: null } }),
        this.prisma.post.count({
          where: { published: false, deletedAt: null },
        }),
        this.prisma.comment.count({ where: { deletedAt: null } }),
        this.prisma.comment.count({
          where: { approved: false, deletedAt: null },
        }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.category.count({ where: { deletedAt: null } }),
        this.prisma.tag.count({ where: { deletedAt: null } }),
      ]);

      return {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          drafts: draftPosts,
        },
        comments: {
          total: totalComments,
          pending: pendingComments,
        },
        users: { total: totalUsers },
        categories: { total: totalCategories },
        tags: { total: totalTags },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get dashboard stats: ${error.message}`,
      );
    }
  }
}
