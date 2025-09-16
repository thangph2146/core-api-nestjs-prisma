import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export abstract class BaseService<T> {
  constructor(protected prisma: PrismaService) {}

  // Soft delete - chỉ đánh dấu deletedAt
  async softDelete(model: string, id: string): Promise<T> {
    return this.prisma[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Restore - xóa đánh dấu deletedAt
  async restoreRecord(model: string, id: string): Promise<T> {
    return this.prisma[model].update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // Bulk soft delete
  async bulkSoftDelete(model: string, ids: string[]): Promise<{ count: number }> {
    return this.prisma[model].updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  // Bulk restore
  async bulkRestoreRecords(model: string, ids: string[]): Promise<{ count: number }> {
    return this.prisma[model].updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
  }

  // Hard delete - xóa vĩnh viễn
  async hardDeleteRecord(model: string, id: string): Promise<T> {
    return this.prisma[model].delete({
      where: { id },
    });
  }

  // Bulk hard delete
  async bulkHardDeleteRecords(model: string, ids: string[]): Promise<{ count: number }> {
    return this.prisma[model].deleteMany({
      where: { id: { in: ids } },
    });
  }

  // Tìm kiếm bao gồm cả deleted records
  async findAllWithDeleted(model: string, params?: any): Promise<T[]> {
    return this.prisma[model].findMany({
      ...params,
    });
  }

  // Tìm kiếm chỉ active records (không bị xóa)
  async findAllActive(model: string, params?: any): Promise<T[]> {
    return this.prisma[model].findMany({
      ...params,
      where: {
        ...params?.where,
        deletedAt: null,
      },
    });
  }

  // Tìm kiếm chỉ deleted records
  async findAllDeleted(model: string, params?: any): Promise<T[]> {
    return this.prisma[model].findMany({
      ...params,
      where: {
        ...params?.where,
        deletedAt: { not: null },
      },
    });
  }
}
