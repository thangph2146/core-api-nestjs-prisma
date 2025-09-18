import { IsString } from 'class-validator';
import { IsOptionalBoolean } from '../../common/decorators/validation.decorators';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptionalBoolean()
  approved?: boolean;

  @IsString()
  authorId: string;

  @IsString()
  postId: string;
}
