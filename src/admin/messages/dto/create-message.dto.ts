import { IsString, IsEnum, IsOptional } from 'class-validator';
import { MessageType, Priority } from '@prisma/client';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  senderId?: string;

  @IsString()
  receiverId: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}

