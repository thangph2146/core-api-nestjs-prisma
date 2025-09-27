import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { BaseController } from '../../common/base.controller';
import { Comment } from '@prisma/client';

@Controller('comments')
export class CommentsController extends BaseController<
  Comment,
  CreateCommentDto,
  UpdateCommentDto
> {
  constructor(private readonly commentsService: CommentsService) {
    super(commentsService, {
      modelName: 'comment',
      createDto: CreateCommentDto,
      updateDto: UpdateCommentDto,
    });
  }

  @Get('post/:postId')
  findByPost(
    @Param('postId') postId: string,
    @Query('approved') approved?: string,
  ) {
    const approvedOnly = approved !== 'false';
    return this.commentsService.findByPost(postId, approvedOnly);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.commentsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.commentsService.reject(id);
  }
}
