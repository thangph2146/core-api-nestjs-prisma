import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ColumnFilterConfig {
  type: 'text' | 'boolean' | 'date' | 'number' | 'select' | 'nested';
  field?: string; // For nested fields, specify the actual database field
  nestedFields?: string[]; // For nested object filtering (e.g., ['name', 'email'] for author)
  options?: Array<{ label: string; value: string }>; // For select type
}

export interface BaseServiceOptions {
  modelName: string;
  searchFields?: string[];
  defaultInclude?: Record<string, unknown> | undefined;
  defaultOrderBy?:
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | undefined;
  columnFilterConfig?: Record<string, ColumnFilterConfig>;
}

@Injectable()
export abstract class BaseService<
  T,
  Create extends object = Record<string, unknown>,
  Update extends object = Record<string, unknown>,
> {
  protected options: BaseServiceOptions;

  constructor(
    protected prisma: PrismaService,
    options?: Partial<BaseServiceOptions>,
  ) {
    this.options = {
      modelName: 'unknown',
      searchFields: ['name', 'title'],
      ...options,
    };
  }

  /**
   * Internal minimal CRUD delegate used to strongly type dynamic Prisma model access
   */
  private getDelegate<M>(model: string): {
    update: (args: {
      where: Record<string, unknown>;
      data: object;
      include?: Record<string, unknown>;
    }) => Promise<M>;
    updateMany: (args: {
      where?: Record<string, unknown>;
      data: object;
    }) => Promise<{ count: number }>;
    delete: (args: { where: Record<string, unknown> }) => Promise<M>;
    deleteMany: (args: {
      where?: Record<string, unknown>;
    }) => Promise<{ count: number }>;
    findMany: (args: {
      skip?: number;
      take?: number;
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
      include?: Record<string, unknown>;
    }) => Promise<M[]>;
    create: (args: {
      data: object;
      include?: Record<string, unknown>;
    }) => Promise<M>;
    findUnique: (args: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => Promise<M | null>;
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  } {
    // Cast through unknown to avoid any-unsafe; we constrain the shape via the returned interface
    return (this.prisma as unknown as Record<string, unknown>)[
      model
    ] as ReturnType<typeof this.getDelegate<M>>;
  }

  // Soft delete - chỉ đánh dấu deletedAt
  async softDelete(model: string, id: string): Promise<T> {
    const delegate = this.getDelegate<T>(model);
    return await delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Restore - xóa đánh dấu deletedAt
  async restoreRecord(model: string, id: string): Promise<T> {
    const delegate = this.getDelegate<T>(model);
    return await delegate.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // Bulk soft delete
  async bulkSoftDelete(
    model: string,
    ids: string[],
  ): Promise<{ count: number }> {
    const delegate = this.getDelegate<T>(model);
    return await delegate.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  // Bulk restore
  async bulkRestoreRecords(
    model: string,
    ids: string[],
  ): Promise<{ count: number }> {
    const delegate = this.getDelegate<T>(model);
    return await delegate.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
  }

  // Hard delete - xóa vĩnh viễn
  async hardDeleteRecord(model: string, id: string): Promise<T> {
    const delegate = this.getDelegate<T>(model);
    return await delegate.delete({
      where: { id },
    });
  }

  // Bulk hard delete
  async bulkHardDeleteRecords(
    model: string,
    ids: string[],
  ): Promise<{ count: number }> {
    const delegate = this.getDelegate<T>(model);
    return await delegate.deleteMany({
      where: { id: { in: ids } },
    });
  }


  // Enhanced paginated find method with search and column filters support
  async findManyPaginatedWithFilters(
    model: string,
    params?: {
      page?: number;
      limit?: number;
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
      include?: Record<string, unknown>;
      includeDeleted?: boolean;
      search?: string;
      columnFilters?: Record<string, string>;
    },
  ): Promise<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    console.log('BaseService: findManyPaginatedWithFilters called with:', { model, params });
    
    const { 
      page = 1, 
      limit = 10, 
      where, 
      orderBy, 
      include, 
      includeDeleted = false, 
      search, 
      columnFilters 
    } = params || {};

    const p = Math.max(1, Number.isFinite(page) ? page : 1);
    const l = Math.max(1, Math.min(100, Number.isFinite(limit) ? limit : 10));
    const skip = (p - 1) * l;

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Apply column filter conditions
    if (columnFilters) {
      const columnFilterConditions = this.buildColumnFilterConditions(columnFilters);
      Object.assign(whereConditions, columnFilterConditions);
    }

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(search, this.options.searchFields || []);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    try {
      const delegate = this.getDelegate<T>(model);
      const [items, total] = await Promise.all([
        delegate.findMany({
          skip,
          take: l,
          where: whereConditions,
          orderBy: orderBy || this.options.defaultOrderBy,
          include: include || this.options.defaultInclude,
        }),
        delegate.count({ where: whereConditions }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / l));
      return {
        items,
        pagination: {
          page: p,
          limit: l,
          total,
          totalPages,
          hasNextPage: p < totalPages,
          hasPrevPage: p > 1,
        },
      };
    } catch (error) {
      console.error('BaseService: Error in findManyPaginatedWithFilters:', error);
      throw error;
    }
  }

  // Generic create method
  async create(data: Create): Promise<T> {
    const delegate = this.getDelegate<T>(this.options.modelName);
    return await delegate.create({
      data,
      include: this.options.defaultInclude,
    });
  }

  // Generic update method
  async update(id: string, data: Update): Promise<T> {
    await this.findOne(id);
    const delegate = this.getDelegate<T>(this.options.modelName);
    return await delegate.update({
      where: { id },
      data,
      include: this.options.defaultInclude,
    });
  }

  // Generic find one method
  protected async findUnique(
    model: string,
    where: Record<string, unknown>,
    include?: Record<string, unknown>,
    includeDeleted: boolean = false,
  ): Promise<T> {
    const delegate = this.getDelegate<T>(model);
    const result = await delegate.findUnique({
      where,
      include,
    });

    if (!result) {
      throw new NotFoundException(`${model} not found`);
    }

    if (
      !includeDeleted &&
      (result as unknown as { deletedAt?: Date | null }).deletedAt
    ) {
      throw new NotFoundException(`${model} not found`);
    }

    return result;
  }

  // Build search conditions for common fields
  protected buildSearchConditions(
    search: string | undefined,
    searchFields: string[],
  ):
    | {
        OR: Array<{ [key: string]: { contains: string; mode?: 'insensitive' } }>;
      }
    | undefined {
    if (!search || !search.trim()) {
      return undefined;
    }

    const searchTerm = search.trim();
    return {
      OR: searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      })),
    };
  }

  // Build column filter conditions
  protected buildColumnFilterConditions(
    columnFilters: Record<string, string> | undefined,
  ): Record<string, unknown> {
    if (!columnFilters || Object.keys(columnFilters).length === 0) {
      return {};
    }

    console.log('BaseService: buildColumnFilterConditions called with:', columnFilters);
    const conditions: Record<string, unknown> = {};
    const config = this.options.columnFilterConfig || {};
    console.log('BaseService: columnFilterConfig:', config);

    Object.entries(columnFilters).forEach(([column, value]) => {
      console.log(`BaseService: Processing column filter - ${column}: ${value}`);
      if (value && value.trim() !== '') {
        const columnConfig = config[column];
        console.log(`BaseService: Column config for ${column}:`, columnConfig);
        
        if (columnConfig) {
          // Use configured filter type
          switch (columnConfig.type) {
            case 'boolean':
              const field = columnConfig.field || column;
              conditions[field] = value === 'true';
              break;
              
            case 'date':
              const dateField = columnConfig.field || column;
              conditions[dateField] = {
                gte: new Date(value),
                lte: new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000 - 1), // End of day
              };
              break;
              
            case 'number':
              const numberField = columnConfig.field || column;
              conditions[numberField] = Number(value);
              break;
              
            case 'select':
              const selectField = columnConfig.field || column;
              conditions[selectField] = value;
              break;
              
            case 'nested':
              const nestedField = columnConfig.field || column;
              if (columnConfig.nestedFields && columnConfig.nestedFields.length > 0) {
              conditions[nestedField] = {
                OR: columnConfig.nestedFields.map(field => ({
                  [field]: { contains: value, mode: 'insensitive' }
                }))
              };
              }
              break;

            case 'text':
            default:
              const textField = columnConfig.field || column;
              conditions[textField] = {
                contains: value, mode: 'insensitive',
              };
              break;
          }
        } else {
          // Fallback to auto-detection based on column name patterns
          if (column.includes('Date') || column.includes('At')) {
            conditions[column] = {
              gte: new Date(value),
              lte: new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000 - 1),
            };
          } else if (column.includes('Id') || column === 'id') {
            conditions[column] = value;
          } else {
            conditions[column] = {
              contains: value, mode: 'insensitive',
            };
          }
        }
        console.log(`BaseService: Added condition for ${column}:`, conditions[column]);
      }
    });

    console.log('BaseService: Final column filter conditions:', conditions);
    return conditions;
  }

  // Generic findOne method using model name from options
  async findOne(id: string, includeDeleted: boolean = false): Promise<T> {
    return this.findUnique(
      this.options.modelName,
      { id },
      undefined,
      includeDeleted,
    );
  }


  // Generic findDeleted method
  async findDeleted(params?: { 
    search?: string; 
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const searchConditions = this.buildSearchConditions(
      params?.search,
      this.options.searchFields || [],
    );

    const whereConditions = {
      deletedAt: { not: null },
      ...(searchConditions ? { OR: searchConditions.OR } : {}),
    };

    return this.findManyPaginatedWithFilters(this.options.modelName, {
      where: whereConditions,
      includeDeleted: true,
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search,
      columnFilters: params?.columnFilters || {},
    });
  }

  // Generic remove method (soft delete)
  async remove(id: string): Promise<T> {
    await this.findOne(id);
    return this.softDelete(this.options.modelName, id);
  }

  // Generic hardDelete method
  async hardDelete(id: string): Promise<T> {
    await this.findOne(id);
    return this.hardDeleteRecord(this.options.modelName, id);
  }

  // Generic restore method
  async restore(id: string): Promise<T> {
    return this.restoreRecord(this.options.modelName, id);
  }

  // Generic bulkDelete method
  async bulkDelete(bulkDeleteDto: {
    ids: string[];
  }): Promise<{ count: number }> {
    return this.bulkSoftDelete(this.options.modelName, bulkDeleteDto.ids);
  }

  // Generic bulkRestore method
  async bulkRestore(bulkRestoreDto: {
    ids: string[];
  }): Promise<{ count: number }> {
    return this.bulkRestoreRecords(this.options.modelName, bulkRestoreDto.ids);
  }

  // Generic bulkHardDelete method
  async bulkHardDelete(bulkHardDeleteDto: {
    ids: string[];
  }): Promise<{ count: number }> {
    return this.bulkHardDeleteRecords(
      this.options.modelName,
      bulkHardDeleteDto.ids,
    );
  }
}
