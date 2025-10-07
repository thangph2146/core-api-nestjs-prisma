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
    const columnFilters: Record<string, string | string[]> = {};

    Object.entries(query).forEach(([key, value]) => {
      const match = key.match(/^columnFilters\[(.+?)\](?:\[\])?$/);
      if (!match) {
        return;
      }

      const column = match[1];
      const values = this.normalizeFilterInput(value);
      if (values.length === 0) {
        delete normalized[key];
        return;
      }

      const existing = columnFilters[column];
      if (Array.isArray(existing)) {
        columnFilters[column] = [...existing, ...values];
      } else if (typeof existing === 'string') {
        columnFilters[column] = [existing, ...values];
      } else {
        columnFilters[column] = values.length === 1 ? values[0] : values;
      }

      delete normalized[key];
    });

    if (Object.keys(columnFilters).length > 0) {
      normalized.columnFilters = columnFilters;
    }

    const pageValue = normalized.page;
    const limitValue = normalized.limit;
    const page = this.parseNumericQueryParam(pageValue);
    const limit = this.parseNumericQueryParam(limitValue);

    if (pageValue !== undefined) {
      delete normalized.page;
    }

    if (limitValue !== undefined) {
      delete normalized.limit;
    }

    console.log('BaseController: Calling findManyPaginatedWithFilters with:', {
      modelName: this.options.modelName,
      page,
      limit,
      normalized,
    });

    try {
      const result = await this.service.findManyPaginatedWithFilters(
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

      return result;
    } catch (error) {
      console.error(
        'BaseController: Error calling findManyPaginatedWithFilters:',
        error,
      );
      return this.service.findAll(normalized);
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

  private normalizeFilterInput(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter(
          (item): item is string | number | boolean =>
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean',
        )
        .map((item) => item.toString());
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return [value.toString()];
    }

    return [];
  }

  private parseNumericQueryParam(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }
}
