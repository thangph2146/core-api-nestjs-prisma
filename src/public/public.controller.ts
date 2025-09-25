import { Controller, Get, Query, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Public blog posts - only published posts
  @Public()
  @Get('posts')
  getPublicPosts(
    @Query()
    query: {
      page?: number | string;
      limit?: number | string;
      authorId?: string;
      categoryId?: string;
      tagId?: string;
      search?: string;
      orderBy?: 'newest' | 'oldest' | 'popular';
    },
  ) {
    return this.publicService.getPublicPosts(query);
  }

  // Public post by slug
  @Public()
  @Get('posts/slug/:slug')
  getPublicPostBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicPostBySlug(slug);
  }

  // Public categories - only active categories
  @Public()
  @Get('categories')
  getPublicCategories(
    @Query() query: { page?: number; limit?: number; search?: string },
  ) {
    return this.publicService.getPublicCategories(query);
  }

  // Public category by slug
  @Public()
  @Get('categories/slug/:slug')
  getPublicCategoryBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicCategoryBySlug(slug);
  }

  // Public tags - only active tags
  @Public()
  @Get('tags')
  getPublicTags(
    @Query() query: { page?: number; limit?: number; search?: string },
  ) {
    return this.publicService.getPublicTags(query);
  }

  // Public tag by slug
  @Public()
  @Get('tags/slug/:slug')
  getPublicTagBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicTagBySlug(slug);
  }

  // Public comments - only approved comments
  @Public()
  @Get('posts/:postId/comments')
  getPublicComments(
    @Param('postId') postId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    return this.publicService.getPublicComments(postId, {
      skip,
      take: limit,
    });
  }

  // Public search
  @Public()
  @Get('search')
  searchPublicContent(
    @Query()
    query: {
      q: string;
      type?: 'posts' | 'categories' | 'tags' | 'all';
      page?: number;
      limit?: number;
    },
  ) {
    return this.publicService.searchPublicContent(query);
  }

  // Get related posts
  @Public()
  @Get('posts/:postId/related')
  getRelatedPosts(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 5;
    return this.publicService.getRelatedPosts(postId, limitNumber);
  }
}
