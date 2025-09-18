import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BaseController } from '../common/base.controller';
import { Post } from '@prisma/client';

@Controller('posts')
export class PostsController extends BaseController<Post, CreatePostDto, UpdatePostDto> {
  constructor(private readonly postsService: PostsService) {
    super(postsService, {
      modelName: 'post',
      createDto: CreatePostDto,
      updateDto: UpdatePostDto,
      includeSlug: true,
    });
  }

  @Get('blog')
  findForBlog(@Query() query: any) {
    return this.postsService.findForBlog(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.postsService.publish(id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.postsService.unpublish(id);
  }
}
