import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import { BaseService } from '../../common/base.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService extends BaseService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'user',
      searchFields: ['name', 'email'],
      defaultInclude: {
        posts: true,
        comments: true,
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        name: { type: 'text' },
        email: { type: 'text' },
        role: { type: 'select' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
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
    columnFilters?: Record<string, string>;
  }): Promise<User[]> {
    const {
      skip,
      take,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    } = params || {};

    // Use the new paginated method for consistency
    const result = await this.findManyPaginatedWithFilters('user', {
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      limit: take || 10,
      where,
      orderBy,
      includeDeleted,
      search,
      columnFilters,
    });

    return result.items;
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<User> {
    try {
      return await this.findUnique(
        'user',
        { id },
        {
          posts: true,
          comments: true,
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // Check if user exists

    // Hash password if it's being updated
    const updateData = { ...updateUserDto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
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

  // Get deleted users
  async findDeleted(params?: {
    search?: string;
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('user', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}
