import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Message, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';

@Injectable()
export class MessagesService extends BaseService<
  Message,
  CreateMessageDto,
  UpdateMessageDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'message',
      searchFields: ['subject', 'content'],
      defaultInclude: {
        sender: true,
        receiver: true,
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        subject: { type: 'text' },
        type: { type: 'select' },
        priority: { type: 'select' },
        isRead: { type: 'boolean' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    // Get sender parent info
    const senderParent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!senderParent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    // Verify receiver exists
    const receiverParent = await this.prisma.parent.findUnique({
      where: { id: sendMessageDto.receiverId },
    });

    if (!receiverParent) {
      throw new NotFoundException('Không tìm thấy người nhận');
    }

    return this.prisma.message.create({
      data: {
        senderId: senderParent.id,
        receiverId: sendMessageDto.receiverId,
        subject: sendMessageDto.subject,
        content: sendMessageDto.content,
        type: sendMessageDto.type,
        priority: sendMessageDto.priority,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async getInbox(userId: string, filters?: {
    isRead?: boolean;
    type?: string;
  }) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    const where: Prisma.MessageWhereInput = {
      receiverId: parent.id,
      deletedAt: null,
    };

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.type) {
      where.type = filters.type as any;
    }

    return this.prisma.message.findMany({
      where,
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSent(userId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    return this.prisma.message.findMany({
      where: {
        senderId: parent.id,
        deletedAt: null,
      },
      include: {
        receiver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        receiver: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    // Verify ownership
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent || message.receiverId !== parent.id) {
      throw new ForbiddenException('Bạn không có quyền đánh dấu tin nhắn này');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async markAsUnread(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        receiver: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    // Verify ownership
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent || message.receiverId !== parent.id) {
      throw new ForbiddenException('Bạn không có quyền đánh dấu tin nhắn này');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: false },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!parent) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    return this.prisma.message.count({
      where: {
        receiverId: parent.id,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<Message[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    const result = await this.findManyPaginatedWithFilters('message', {
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      limit: take || 10,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    });

    return result.items;
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<Message> {
    try {
      return await this.findUnique(
        'message',
        { id },
        {
          sender: true,
          receiver: true,
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Không tìm thấy tin nhắn với ID ${id}`);
    }
  }

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    return this.prisma.message.create({
      data: createMessageDto,
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    await this.findOne(id);

    return this.prisma.message.update({
      where: { id },
      data: updateMessageDto,
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async remove(id: string): Promise<Message> {
    await this.findOne(id);
    return this.softDelete('message', id);
  }

  async hardDelete(id: string): Promise<Message> {
    await this.findOne(id);
    return this.hardDeleteRecord('message', id);
  }

  async restore(id: string): Promise<Message> {
    return this.restoreRecord('message', id);
  }

  async findDeleted(params?: {
    search?: string;
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('message', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}

