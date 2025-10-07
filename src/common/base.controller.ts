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
  async findAll(@Query() query: Record<string, unknown>) {
    // Normalize bracket-notation query params: columnFilters[foo]=bar -> columnFilters: { foo: 'bar' }
    const normalized: Record<string, unknown> = { ...query };
    const columnFilters: Record<string, string | string[]> =
      (normalized.columnFilters as Record<string, string | string[]>) || {};

    Object.keys(query).forEach((key) => {
      const match = key.match(/^columnFilters\[(.+?)\](?:\[\])?$/);
      if (match) {
        const col = match[1];
        const rawVal = query[key];
        if (rawVal !== undefined && rawVal !== null) {
          const existing = columnFilters[col];
          if (Array.isArray(rawVal)) {
            const newValues = rawVal.map((val) => (val ?? '').toString());
            if (Array.isArray(existing)) {
              columnFilters[col] = [...existing, ...newValues];
            } else if (typeof existing === 'string') {
              columnFilters[col] = [existing, ...newValues];
            } else {
              columnFilters[col] = newValues;
            }
          } else {
            const stringValue = String(rawVal);
            if (Array.isArray(existing)) {
              columnFilters[col] = [...existing, stringValue];
            } else if (typeof existing === 'string') {
              columnFilters[col] = [existing, stringValue];
            } else {
              columnFilters[col] = stringValue;
            }
          }
        }
        // Remove the bracketed key from the root-level query
        delete normalized[key];
      }
    });

    if (Object.keys(columnFilters).length > 0) {
      normalized.columnFilters = columnFilters;
    }

    // Extract pagination params
    const page = normalized.page ? Number(normalized.page) : undefined;
    const limit = normalized.limit ? Number(normalized.limit) : undefined;

    // Remove raw page/limit to avoid being treated as filters
    delete normalized.page;
    delete normalized.limit;

    // Use findManyPaginatedWithFilters method from BaseService for proper pagination structure
    console.log('BaseController: Calling findManyPaginatedWithFilters with:', {
      modelName: this.options.modelName,
      page,
      limit,
      normalized,
    });

    try {
      const result = await (this.service as any).findManyPaginatedWithFilters(
        this.options.modelName,
        {
          page,
          limit,
          ...normalized,
        },
      );

      console.log(
        'BaseController: Result from findManyPaginatedWithFilters:',
        result,
      );

      // Return paginated result; interceptor will wrap with success and timestamp
      return result;
    } catch (error) {
      console.error(
        'BaseController: Error calling findManyPaginatedWithFilters:',
        error,
      );
      // Fallback to original findAll method
      const items = await (this.service as any).findAll(normalized);
      return items;
    }
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
