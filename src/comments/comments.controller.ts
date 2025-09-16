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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.commentsService.findAll(query);
  }

  @Get('deleted')
  findDeleted(@Query() query: any) {
    return this.commentsService.findDeleted(query);
  }

  @Get('post/:postId')
  findByPost(@Param('postId') postId: string, @Query('approved') approved?: string) {
    const approvedOnly = approved !== 'false';
    return this.commentsService.findByPost(postId, approvedOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.commentsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.commentsService.reject(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.commentsService.hardDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.commentsService.restore(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.commentsService.bulkDelete(bulkDeleteDto);
  }

  @Post('bulk-restore')
  bulkRestore(@Body() bulkRestoreDto: BulkRestoreDto) {
    return this.commentsService.bulkRestore(bulkRestoreDto);
  }

  @Post('bulk-hard-delete')
  bulkHardDelete(@Body() bulkHardDeleteDto: BulkHardDeleteDto) {
    return this.commentsService.bulkHardDelete(bulkHardDeleteDto);
  }
}
