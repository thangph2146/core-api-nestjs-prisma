import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsObject()
  content: any; // SerializedEditorState từ Lexical editor

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsString()
  authorId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
