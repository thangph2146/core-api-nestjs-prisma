import { Controller, Get, Query, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Public blog posts - only published posts
  @Get('posts')
  getPublicPosts(@Query() query: any) {
    return this.publicService.getPublicPosts(query);
  }

  // Public post by slug
  @Get('posts/slug/:slug')
  getPublicPostBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicPostBySlug(slug);
  }

  // Public categories - only active categories
  @Get('categories')
  getPublicCategories(@Query() query: any) {
    return this.publicService.getPublicCategories(query);
  }

  // Public category by slug
  @Get('categories/slug/:slug')
  getPublicCategoryBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicCategoryBySlug(slug);
  }

  // Public tags - only active tags
  @Get('tags')
  getPublicTags(@Query() query: any) {
    return this.publicService.getPublicTags(query);
  }

  // Public tag by slug
  @Get('tags/slug/:slug')
  getPublicTagBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicTagBySlug(slug);
  }

  // Public comments - only approved comments
  @Get('posts/:postId/comments')
  getPublicComments(@Param('postId') postId: string, @Query() query: any) {
    return this.publicService.getPublicComments(postId, query);
  }

  // Public search
  @Get('search')
  searchPublicContent(@Query() query: any) {
    return this.publicService.searchPublicContent(query);
  }

  // Get related posts
  @Get('posts/:postId/related')
  getRelatedPosts(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 5;
    return this.publicService.getRelatedPosts(postId, limitNumber);
  }
}
