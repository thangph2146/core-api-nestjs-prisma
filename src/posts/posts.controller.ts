import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll(@Query() query: any) {
    console.log('PostsController.findAll called with query:', query);
    return this.postsService.findAll(query);
  }

  @Get('blog')
  findForBlog(@Query() query: any) {
    return this.postsService.findForBlog(query);
  }

  @Get('deleted')
  findDeleted(@Query() query: any) {
    return this.postsService.findDeleted(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('PostsController.findOne called with id:', id);
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.postsService.publish(id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.postsService.unpublish(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.postsService.hardDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.postsService.restore(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.postsService.bulkDelete(bulkDeleteDto);
  }

  @Post('bulk-restore')
  bulkRestore(@Body() bulkRestoreDto: BulkRestoreDto) {
    return this.postsService.bulkRestore(bulkRestoreDto);
  }

  @Post('bulk-hard-delete')
  bulkHardDelete(@Body() bulkHardDeleteDto: BulkHardDeleteDto) {
    return this.postsService.bulkHardDelete(bulkHardDeleteDto);
  }
}
