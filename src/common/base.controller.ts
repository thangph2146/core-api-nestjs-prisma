import { Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BaseService } from './base.service';
import {
  BulkDeleteDto,
  BulkRestoreDto,
  BulkHardDeleteDto,
} from './dto/bulk-operations.dto';

export interface BaseControllerOptions {
  modelName: string;
  createDto: unknown;
  updateDto: unknown;
  includeSlug?: boolean;
  customEndpoints?: Array<{
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    handler: string;
  }>;
}

export abstract class BaseController<
  T,
  CreateDto extends object,
  UpdateDto extends object,
> {
  constructor(
    protected readonly service: BaseService<T, CreateDto, UpdateDto>,
    protected readonly options: BaseControllerOptions,
  ) {}

  @Post()
  create(@Body() createDto: CreateDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query() query: Record<string, unknown>) {
    // Normalize bracket-notation query params: columnFilters[foo]=bar -> columnFilters: { foo: 'bar' }
    const normalized: Record<string, unknown> = { ...query };
    const columnFilters: Record<string, string> =
      (normalized.columnFilters as Record<string, string>) || {};

    Object.keys(query).forEach((key) => {
      const match = key.match(/^columnFilters\[(.+)\]$/);
      if (match) {
        const col = match[1];
        const rawVal = query[key];
        // Keep values as strings; type coercion will be handled in BaseService.buildColumnFilterConditions
        if (rawVal !== undefined && rawVal !== null) {
          columnFilters[col] = String(rawVal);
        }
        // Remove the bracketed key from the root-level query
        delete (normalized as Record<string, unknown>)[key];
      }
    });

    if (Object.keys(columnFilters).length > 0) {
      normalized.columnFilters = columnFilters;
    }

    return this.service.findAll(normalized as Record<string, unknown>);
  }

  @Get('deleted')
  findDeleted(@Query() query: { search?: string }) {
    return this.service.findDeleted(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.service.hardDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.service.bulkDelete(bulkDeleteDto);
  }

  @Post('bulk-restore')
  bulkRestore(@Body() bulkRestoreDto: BulkRestoreDto) {
    return this.service.bulkRestore(bulkRestoreDto);
  }

  @Post('bulk-hard-delete')
  bulkHardDelete(@Body() bulkHardDeleteDto: BulkHardDeleteDto) {
    return this.service.bulkHardDelete(bulkHardDeleteDto);
  }
}
