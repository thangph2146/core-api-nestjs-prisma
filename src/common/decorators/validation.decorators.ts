import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsEmail, IsEnum, IsUUID, IsUrl, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Common validation decorators
export function IsOptionalString() {
  return applyDecorators(
    IsOptional(),
    IsString(),
    Transform(({ value }) => value?.trim())
  );
}

export function IsOptionalNumber() {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber()
  );
}

export function IsOptionalBoolean() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => {
      if (typeof value === 'string') {
        return value === 'true';
      }
      return value;
    }),
    IsBoolean()
  );
}

export function IsOptionalArray() {
  return applyDecorators(
    IsOptional(),
    IsArray()
  );
}

export function IsOptionalEmail() {
  return applyDecorators(
    IsOptional(),
    IsEmail(),
    Transform(({ value }) => value?.toLowerCase().trim())
  );
}

export function IsOptionalEnum(enumObject: any) {
  return applyDecorators(
    IsOptional(),
    IsEnum(enumObject)
  );
}

export function IsOptionalUUID() {
  return applyDecorators(
    IsOptional(),
    IsUUID()
  );
}

export function IsOptionalUrl() {
  return applyDecorators(
    IsOptional(),
    IsUrl()
  );
}

export function IsOptionalDateString() {
  return applyDecorators(
    IsOptional(),
    IsDateString()
  );
}

// Pagination decorators
export function IsPage() {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Transform(({ value }) => Math.max(1, Number(value) || 1))
  );
}

export function IsLimit() {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Max(100),
    Transform(({ value }) => Math.min(100, Math.max(1, Number(value) || 10)))
  );
}

// Search and sort decorators
export function IsOptionalSearch() {
  return applyDecorators(
    IsOptional(),
    IsString(),
    Transform(({ value }) => value?.trim())
  );
}

export function IsOptionalSortBy(allowedFields: string[]) {
  return applyDecorators(
    IsOptional(),
    IsString(),
    Transform(({ value }) => {
      if (value && !allowedFields.includes(value)) {
        return allowedFields[0]; // Default to first allowed field
      }
      return value;
    })
  );
}

export function IsOptionalSortOrder() {
  return applyDecorators(
    IsOptional(),
    IsEnum(['asc', 'desc']),
    Transform(({ value }) => value || 'desc')
  );
}
