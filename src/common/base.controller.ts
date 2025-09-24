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

export abstract class BaseController<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly service: BaseService<T>,
    protected readonly options: BaseControllerOptions,
  ) {}

  @Post()
  create(@Body() createDto: CreateDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query() query: Record<string, unknown>) {
    return this.service.findAll(query);
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
