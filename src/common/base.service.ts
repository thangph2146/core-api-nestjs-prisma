import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BaseServiceOptions {
  modelName: string;
  searchFields?: string[];
  defaultInclude?: Record<string, unknown> | undefined;
  defaultOrderBy?:
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | undefined;
}

@Injectable()
export abstract class BaseService<T> {
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
      data: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => Promise<M>;
    updateMany: (args: {
      where?: Record<string, unknown>;
      data: Record<string, unknown>;
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
      data: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => Promise<M>;
    findUnique: (args: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => Promise<M | null>;
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

  // Generic find method with common patterns
  protected async findMany(
    model: string,
    params?: {
      skip?: number;
      take?: number;
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
      include?: Record<string, unknown>;
      includeDeleted?: boolean;
    },
  ): Promise<T[]> {
    const { skip, take, where, orderBy, include, includeDeleted } =
      params || {};

    const whereConditions = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    const delegate = this.getDelegate<T>(model);
    return await delegate.findMany({
      skip,
      take,
      where: whereConditions,
      orderBy: orderBy || this.options.defaultOrderBy,
      include: include || this.options.defaultInclude,
    });
  }

  // Generic create method
  async create(data: Record<string, unknown>): Promise<T> {
    const delegate = this.getDelegate<T>(this.options.modelName);
    return await delegate.create({
      data,
      include: this.options.defaultInclude,
    });
  }

  // Generic update method
  async update(id: string, data: Record<string, unknown>): Promise<T> {
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
      throw new Error(`${model} not found`);
    }

    if (
      !includeDeleted &&
      (result as unknown as { deletedAt?: Date | null }).deletedAt
    ) {
      throw new Error(`${model} not found`);
    }

    return result;
  }

  // Build search conditions for common fields
  protected buildSearchConditions(
    search: string | undefined,
    searchFields: string[],
  ):
    | {
        OR: Array<{ [key: string]: { contains: string; mode: 'insensitive' } }>;
      }
    | undefined {
    if (!search || !search.trim()) {
      return undefined;
    }

    const searchTerm = search.trim();
    return {
      OR: searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as const },
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

  // Generic findAll method using model name from options
  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
    include?: Record<string, unknown>;
    includeDeleted?: boolean;
    search?: string;
  }): Promise<T[]> {
    const { search, ...otherParams } = params || {};
    const searchConditions = this.buildSearchConditions(
      search,
      this.options.searchFields || [],
    );

    const whereConditions = {
      ...otherParams?.where,
      ...(searchConditions ? { OR: searchConditions.OR } : {}),
    };

    return this.findMany(this.options.modelName, {
      ...otherParams,
      where: whereConditions,
    });
  }

  // Generic findDeleted method
  async findDeleted(params?: { search?: string }): Promise<T[]> {
    const searchConditions = this.buildSearchConditions(
      params?.search,
      this.options.searchFields || [],
    );

    const whereConditions = {
      deletedAt: { not: null },
      ...(searchConditions ? { OR: searchConditions.OR } : {}),
    };

    return this.findMany(this.options.modelName, {
      where: whereConditions,
      includeDeleted: true,
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
