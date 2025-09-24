import { IsString, IsDateString, IsOptional, IsObject } from 'class-validator';
import {
  IsOptionalString,
  IsOptionalNumber,
  IsOptionalEnum,
  IsOptionalUUID,
  IsPage,
  IsLimit,
  IsOptionalSearch,
  IsOptionalSortBy,
  IsOptionalSortOrder,
} from '../decorators/validation.decorators';

export class BaseQueryDto {
  @IsOptionalNumber()
  skip?: number;

  @IsOptionalNumber()
  take?: number;

  @IsOptionalSearch()
  search?: string;

  @IsOptionalSortBy(['createdAt', 'updatedAt', 'name', 'title'])
  sortBy?: string;

  @IsOptionalSortOrder()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsObject()
  columnFilters?: Record<string, string>;
}

export class PaginationDto {
  @IsPage()
  page?: number = 1;

  @IsLimit()
  limit?: number = 10;
}

export class PublicQueryDto extends BaseQueryDto {
  @IsOptionalUUID()
  authorId?: string;

  @IsOptionalUUID()
  categoryId?: string;

  @IsOptionalUUID()
  tagId?: string;

  @IsOptionalEnum({ newest: 'newest', oldest: 'oldest', popular: 'popular' })
  orderBy?: 'newest' | 'oldest' | 'popular';
}

export class BaseEntityDto {
  @IsString()
  id: string;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  @IsOptionalString()
  deletedAt?: Date | null;
}
