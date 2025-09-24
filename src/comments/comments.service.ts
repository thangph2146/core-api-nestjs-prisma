import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';

@Injectable()
export class CommentsService extends BaseService<Comment, CreateCommentDto, UpdateCommentDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'comment',
      searchFields: ['content'],
      defaultOrderBy: { createdAt: 'desc' },
    });
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.prisma.comment.create({
      data: createCommentDto,
      include: {
        author: true,
        post: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CommentWhereUniqueInput;
    where?: Prisma.CommentWhereInput;
    orderBy?: Prisma.CommentOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
  }): Promise<Comment[]> {
    const { skip, take, where, orderBy, includeDeleted, search } = params || {};

    // Build where conditions
    const whereConditions: Prisma.CommentWhereInput = {
      ...where,
    };

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(search, ['content']);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('comment', {
      skip,
      take,
      where: whereConditions,
      orderBy,
      include: {
        author: true,
        post: true,
      },
      includeDeleted,
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<Comment> {
    try {
      return await this.findUnique(
        'comment',
        { id },
        {
          author: true,
          post: true,
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
  }

  async findByPost(
    postId: string,
    approvedOnly: boolean = true,
  ): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: {
        postId,
        ...(approvedOnly && { approved: true }),
      },
      include: {
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    await this.findOne(id); // Check if comment exists
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        author: true,
        post: true,
      },
    });
  }

  // Soft delete
  async remove(id: string): Promise<Comment> {
    await this.findOne(id); // Check if comment exists
    return this.softDelete('comment', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<Comment> {
    await this.findOne(id);
    return this.hardDeleteRecord('comment', id);
  }

  // Restore
  async restore(id: string): Promise<Comment> {
    return this.restoreRecord('comment', id);
  }

  // Bulk operations

  // Get deleted comments
  async findDeleted(params?: { search?: string }): Promise<Comment[]> {
    const whereConditions: Prisma.CommentWhereInput = {
      deletedAt: { not: null },
    };

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(params?.search, [
      'content',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('comment', {
      where: whereConditions,
      include: {
        author: true,
        post: true,
      },
      includeDeleted: true,
    });
  }

  async approve(id: string): Promise<Comment> {
    return this.update(id, { approved: true });
  }

  async reject(id: string): Promise<Comment> {
    return this.update(id, { approved: false });
  }
}
