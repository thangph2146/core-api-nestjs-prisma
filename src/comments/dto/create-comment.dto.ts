import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsString()
  authorId: string;

  @IsString()
  postId: string;
}
