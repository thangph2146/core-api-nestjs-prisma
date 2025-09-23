import { IsString, IsObject } from 'class-validator';
import {
  IsOptionalString,
  IsOptionalBoolean,
  IsOptionalArray,
} from '../../common/decorators/validation.decorators';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsObject()
  content: any; // SerializedEditorState từ Lexical editor

  @IsOptionalString()
  excerpt?: string;

  @IsString()
  slug: string;

  @IsOptionalString()
  image?: string;

  @IsOptionalBoolean()
  published?: boolean;

  @IsString()
  authorId: string;

  @IsOptionalArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptionalArray()
  @IsString({ each: true })
  tagIds?: string[];
}
