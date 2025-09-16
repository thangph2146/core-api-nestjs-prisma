import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import { BaseService } from '../common/base.service';
import { BulkDeleteDto, BulkRestoreDto, BulkHardDeleteDto } from '../common/dto/bulk-operations.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted, search } = params || {};
    
    // Build where conditions
    const whereConditions: Prisma.UserWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    // Add search conditions if search parameter is provided
    if (search && search.trim()) {
      whereConditions.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        { email: { contains: search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where: whereConditions,
      orderBy,
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
        comments: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!includeDeleted && (user as any).deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // Check if user exists
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // Soft delete
  async remove(id: string): Promise<User> {
    await this.findOne(id); // Check if user exists
    return this.softDelete('user', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<User> {
    await this.findOne(id); // Check if user exists
    return this.hardDeleteRecord('user', id);
  }

  // Restore
  async restore(id: string): Promise<User> {
    return this.restoreRecord('user', id);
  }

  // Bulk operations
  async bulkDelete(bulkDeleteDto: BulkDeleteDto): Promise<{ count: number }> {
    return this.bulkSoftDelete('user', bulkDeleteDto.ids);
  }

  async bulkRestore(bulkRestoreDto: BulkRestoreDto): Promise<{ count: number }> {
    return this.bulkRestoreRecords('user', bulkRestoreDto.ids);
  }

  async bulkHardDelete(bulkHardDeleteDto: BulkHardDeleteDto): Promise<{ count: number }> {
    return this.bulkHardDeleteRecords('user', bulkHardDeleteDto.ids);
  }

  // Get deleted users
  async findDeleted(params?: { search?: string }): Promise<User[]> {
    const whereConditions: any = { deletedAt: { not: null } };
    
    // Add search conditions if search parameter is provided
    if (params?.search && params.search.trim()) {
      whereConditions.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' as const } },
        { email: { contains: params.search.trim(), mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.user.findMany({
      where: whereConditions,
      include: {
        posts: true,
        comments: true,
      },
    });
  }
}
