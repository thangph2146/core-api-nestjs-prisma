import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';

@Injectable()
export class CommentsService extends BaseService<Comment> {
  constructor(prisma: PrismaService) {
    super(prisma);
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
    const { skip, take, cursor, where, orderBy, includeDeleted, search } = params || {};
    
    // Build where conditions
    const whereConditions: Prisma.CommentWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Add search conditions if search parameter is provided
    if (search && search.trim()) {
      whereConditions.OR = [
        { content: { contains: search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.comment.findMany({
      skip,
      take,
      cursor,
      where: whereConditions,
      orderBy,
      include: {
        author: true,
        post: true,
      },
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (!includeDeleted && (comment as any).deletedAt) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async findByPost(postId: string, approvedOnly: boolean = true): Promise<Comment[]> {
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

  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
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
  async bulkDelete(bulkDeleteDto: BulkDeleteDto): Promise<{ count: number }> {
    return this.bulkSoftDelete('comment', bulkDeleteDto.ids);
  }

  async bulkRestore(bulkRestoreDto: BulkRestoreDto): Promise<{ count: number }> {
    return this.bulkRestoreRecords('comment', bulkRestoreDto.ids);
  }

  async bulkHardDelete(bulkHardDeleteDto: BulkHardDeleteDto): Promise<{ count: number }> {
    return this.bulkHardDeleteRecords('comment', bulkHardDeleteDto.ids);
  }

  // Get deleted comments
  async findDeleted(params?: { search?: string }): Promise<Comment[]> {
    const whereConditions: any = { deletedAt: { not: null } };
    
    // Add search conditions if search parameter is provided
    if (params?.search && params.search.trim()) {
      whereConditions.OR = [
        { content: { contains: params.search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.comment.findMany({
      where: whereConditions,
      include: {
        author: true,
        post: true,
      },
    });
  }

  async approve(id: string): Promise<Comment> {
    return this.update(id, { approved: true });
  }

  async reject(id: string): Promise<Comment> {
    return this.update(id, { approved: false });
  }
}
