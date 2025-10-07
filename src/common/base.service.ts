import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ColumnFilterConfig {
  type:
    | 'text'
    | 'boolean'
    | 'date'
    | 'number'
    | 'select'
    | 'nested'
    | 'relation';
  field?: string; // For nested fields, specify the actual database field
  nestedFields?: string[]; // For nested object filtering (e.g., ['name', 'email'] for author)
  options?: Array<{ label: string; value: string }>; // For select type
  relationType?: 'many' | 'one'; // For relation filters, specify cardinality
  relationField?: string; // For relation filters, specify the inner field to match (defaults to id)
  relationOperator?: 'equals' | 'contains'; // Optional operator for relation filters
  allowMultiple?: boolean; // Allow multiple values for the filter
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

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Record<string, unknown>;
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
    include?: Record<string, unknown>;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string | string[]>;
  }): Promise<T[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      include,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    const delegate = this.getDelegate<T>(this.options.modelName);

    const whereConditions: Record<string, unknown> = {
      ...(where || {}),
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (columnFilters) {
      Object.assign(
        whereConditions,
        this.buildColumnFilterConditions(columnFilters),
      );
    }

    const searchConditions = this.buildSearchConditions(
      search,
      this.options.searchFields || [],
    );

    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return delegate.findMany({
      skip,
      take,
      cursor: params?.cursor,
      where: whereConditions,
      orderBy: orderBy || this.options.defaultOrderBy,
      include: include || this.options.defaultInclude,
    });
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
      cursor?: Record<string, unknown>;
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

  async create(
    createDto: Create,
    include?: Record<string, unknown>,
  ): Promise<T> {
    const delegate = this.getDelegate<T>(this.options.modelName);
    return delegate.create({
      data: createDto,
      include: include || this.options.defaultInclude,
    });
  }

  async update(
    id: string,
    updateDto: Update,
    include?: Record<string, unknown>,
  ): Promise<T> {
    const delegate = this.getDelegate<T>(this.options.modelName);
    return delegate.update({
      where: { id },
      data: updateDto,
      include: include || this.options.defaultInclude,
    });
  }

  async findUnique(
    model: string,
    where: Record<string, unknown>,
    include?: Record<string, unknown>,
    includeDeleted: boolean = false,
  ): Promise<T> {
    const delegate = this.getDelegate<T>(model);
    const record = await delegate.findUnique({
      where,
      include: include || this.options.defaultInclude,
    });

    if (!record) {
      throw new NotFoundException(`${model} not found`);
    }

    if (!includeDeleted && (record as Record<string, unknown>)?.['deletedAt']) {
      throw new NotFoundException(`${model} not found`);
    }

    return record;
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
      columnFilters?: Record<string, string | string[]>;
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
    console.log('BaseService: findManyPaginatedWithFilters called with:', {
      model,
      params,
    });

    const {
      page = 1,
      limit = 10,
      where,
      orderBy,
      include,
      includeDeleted = false,
      search,
      columnFilters,
    } = params || {};

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const p = Math.max(1, Number.isFinite(parsedPage) ? parsedPage : 1);
    const l = Math.max(
      1,
      Math.min(100, Number.isFinite(parsedLimit) ? parsedLimit : 10),
    );
    const skip = (p - 1) * l;

    const whereConditions: Record<string, unknown> = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (columnFilters) {
      const columnFilterConditions =
        this.buildColumnFilterConditions(columnFilters);
      Object.assign(whereConditions, columnFilterConditions);
    }

    const searchConditions = this.buildSearchConditions(
      search,
      this.options.searchFields || [],
    );
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
      console.error(
        'BaseService: Error in findManyPaginatedWithFilters:',
        error,
      );
      throw error;
    }
  }

  protected buildColumnFilterConditions(
    columnFilters: Record<string, string | string[]> | undefined,
  ): Record<string, unknown> {
    if (!columnFilters || Object.keys(columnFilters).length === 0) {
      return {};
    }

    console.log(
      'BaseService: buildColumnFilterConditions called with:',
      columnFilters,
    );
    const conditions: Record<string, unknown> = {};
    const config = this.options.columnFilterConfig || {};
    console.log('BaseService: columnFilterConfig:', config);

    Object.entries(columnFilters).forEach(([column, rawValue]) => {
      const values = this.normalizeFilterValues(rawValue);
      console.log(`BaseService: Processing column filter - ${column}:`, values);
      if (values.length === 0) {
        return;
      }

      const firstValue = values[0];
      const columnConfig = config[column];
      console.log(`BaseService: Column config for ${column}:`, columnConfig);

      if (columnConfig) {
        const allowMultiple =
          columnConfig.allowMultiple ?? columnConfig.type === 'relation';
        const effectiveValues = allowMultiple ? values : [firstValue];

        switch (columnConfig.type) {
          case 'boolean': {
            const field = columnConfig.field || column;
            const boolValues = effectiveValues.map((val) => val === 'true');
            conditions[field] =
              boolValues.length > 1 ? { in: boolValues } : boolValues[0];
            break;
          }

          case 'number': {
            const numberField = columnConfig.field || column;
            const numberValues = effectiveValues.map((val) => Number(val));
            conditions[numberField] =
              numberValues.length > 1 ? { in: numberValues } : numberValues[0];
            break;
          }

          case 'select': {
            const selectField = columnConfig.field || column;
            conditions[selectField] =
              effectiveValues.length > 1 ? { in: effectiveValues } : firstValue;
            break;
          }

          case 'nested': {
            const nestedField = columnConfig.field || column;
            if (
              columnConfig.nestedFields &&
              columnConfig.nestedFields.length > 0
            ) {
              conditions[nestedField] = {
                OR: effectiveValues.flatMap((val) =>
                  columnConfig.nestedFields!.map((fieldKey) => ({
                    [fieldKey]: { contains: val, mode: 'insensitive' },
                  })),
                ),
              };
            }
            break;
          }

          case 'relation': {
            const relationField = columnConfig.field || column;
            const relationValueField = columnConfig.relationField || 'id';
            const relationType = columnConfig.relationType || 'one';
            const relationOperator = columnConfig.relationOperator || 'equals';

            if (relationType === 'many') {
              conditions[relationField] = {
                some: this.buildRelationInnerFilter(
                  relationValueField,
                  effectiveValues,
                  relationOperator,
                ),
              };
            } else {
              conditions[relationField] = this.buildRelationInnerFilter(
                relationValueField,
                effectiveValues,
                relationOperator,
              );
            }
            break;
          }

          case 'date': {
            const dateField = columnConfig.field || column;
            const start = new Date(firstValue);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
            if (effectiveValues.length > 1) {
              conditions[dateField] = {
                OR: effectiveValues.map((val) => {
                  const from = new Date(val);
                  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
                  return { gte: from, lte: to };
                }),
              };
            } else {
              conditions[dateField] = { gte: start, lte: end };
            }
            break;
          }

          case 'text':
          default: {
            const textField = columnConfig.field || column;
            conditions[textField] = {
              contains: firstValue,
              mode: 'insensitive',
            };
            break;
          }
        }
      } else {
        const lowerColumn = column.toLowerCase();
        if (lowerColumn.includes('date') || lowerColumn.endsWith('at')) {
          const start = new Date(firstValue);
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
          if (values.length > 1) {
            conditions[column] = {
              OR: values.map((val) => {
                const from = new Date(val);
                const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
                return { gte: from, lte: to };
              }),
            };
          } else {
            conditions[column] = { gte: start, lte: end };
          }
        } else if (lowerColumn.endsWith('id') || column === 'id') {
          conditions[column] = values.length > 1 ? { in: values } : firstValue;
        } else {
          conditions[column] = {
            contains: firstValue,
            mode: 'insensitive',
          };
        }
      }

      console.log(
        `BaseService: Added condition for ${column}:`,
        conditions[column],
      );
    });

    console.log('BaseService: Final column filter conditions:', conditions);
    return conditions;
  }

  private normalizeFilterValues(
    value: string | string[] | undefined,
  ): string[] {
    if (!value) {
      return [];
    }

    const rawValues = Array.isArray(value) ? value : [value];
    return rawValues
      .map((val) => (val ?? '').toString().trim())
      .filter((val) => val !== '');
  }

  private buildRelationInnerFilter(
    field: string,
    values: string[],
    operator: 'equals' | 'contains',
  ): Record<string, unknown> {
    if (!values || values.length === 0) {
      return {};
    }

    const sanitized = values.filter((val) => val !== '');
    if (sanitized.length === 0) {
      return {};
    }

    if (operator === 'contains') {
      if (sanitized.length === 1) {
        return {
          [field]: { contains: sanitized[0], mode: 'insensitive' },
        };
      }

      return {
        OR: sanitized.map((val) => ({
          [field]: { contains: val, mode: 'insensitive' },
        })),
      };
    }

    if (sanitized.length === 1) {
      return {
        [field]: sanitized[0],
      };
    }

    return {
      [field]: { in: sanitized },
    };
  }

  // Build search conditions for common fields
  protected buildSearchConditions(
    search: string | undefined,
    searchFields: string[],
  ):
    | {
        OR: Array<{
          [key: string]: { contains: string; mode?: 'insensitive' };
        }>;
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
    columnFilters?: Record<string, string | string[]>;
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
