import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { BaseController } from '../common/base.controller';
import { Message } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController extends BaseController<
  Message,
  CreateMessageDto,
  UpdateMessageDto
> {
  constructor(private readonly messagesService: MessagesService) {
    super(messagesService, {
      modelName: 'message',
      createDto: CreateMessageDto,
      updateDto: UpdateMessageDto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('send')
  async sendMessage(@Request() req: any, @Body() sendMessageDto: SendMessageDto) {
    return this.messagesService.sendMessage(req.user.userId, sendMessageDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inbox')
  async getInbox(
    @Request() req: any,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
  ) {
    const filters = {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type,
    };
    return this.messagesService.getInbox(req.user.userId, filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sent')
  async getSent(@Request() req: any) {
    return this.messagesService.getSent(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.userId);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/mark-read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.markAsRead(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/mark-unread')
  async markAsUnread(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.markAsUnread(req.user.userId, id);
  }
}

