import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEmail,
  IsEnum,
  IsUUID,
  IsUrl,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Common validation decorators
export function IsOptionalString() {
  return applyDecorators(
    IsOptional(),
    IsString(),
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
  );
}

export function IsOptionalNumber() {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber(),
  );
}

export function IsOptionalBoolean() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }: { value: unknown }) => {
      if (typeof value === 'string') {
        return value === 'true';
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      return value;
    }),
    IsBoolean(),
  );
}

export function IsOptionalArray() {
  return applyDecorators(IsOptional(), IsArray());
}

export function IsOptionalEmail() {
  return applyDecorators(
    IsOptional(),
    IsEmail(),
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.toLowerCase().trim() : value,
    ),
  );
}

export function IsOptionalEnum(enumObject: Record<string, string | number>) {
  return applyDecorators(IsOptional(), IsEnum(enumObject));
}

export function IsOptionalUUID() {
  return applyDecorators(IsOptional(), IsUUID());
}

export function IsOptionalUrl() {
  return applyDecorators(IsOptional(), IsUrl());
}

export function IsOptionalDateString() {
  return applyDecorators(IsOptional(), IsDateString());
}

// Pagination decorators
export function IsPage() {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Transform(({ value }: { value: unknown }) =>
      Math.max(1, Number(value) || 1),
    ),
  );
}

export function IsLimit() {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Max(100),
    Transform(({ value }: { value: unknown }) =>
      Math.min(100, Math.max(1, Number(value) || 10)),
    ),
  );
}

// Search and sort decorators
export function IsOptionalSearch() {
  return applyDecorators(
    IsOptional(),
    IsString(),
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
  );
}

export function IsOptionalSortBy(allowedFields: string[]) {
  return applyDecorators(
    IsOptional(),
    IsString(),
    Transform(({ value }: { value: unknown }) => {
      if (typeof value === 'string' && !allowedFields.includes(value)) {
        return allowedFields[0]; // Default to first allowed field
      }
      return value;
    }),
  );
}

export function IsOptionalSortOrder() {
  return applyDecorators(
    IsOptional(),
    IsEnum(['asc', 'desc']),
    Transform(({ value }: { value: unknown }) =>
      value === 'asc' || value === 'desc' ? value : 'desc',
    ),
  );
}
