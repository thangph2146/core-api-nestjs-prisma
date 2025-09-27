import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import { BaseService } from '../../common/base.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService extends BaseService<User, CreateUserDto, UpdateUserDto> {
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
    const { skip, take, where, orderBy, includeDeleted, search, columnFilters } = params || {};

    // Base where conditions
    const whereConditions: Prisma.UserWhereInput = {
      ...where,
    };

    // Apply column filter conditions
    if (columnFilters) {
      const columnFilterConditions = this.buildColumnFilterConditions(columnFilters);
      Object.assign(whereConditions, columnFilterConditions);
    }

    // Apply search conditions
    const searchConditions = this.buildSearchConditions(search, ['name', 'email']);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('user', {
      skip,
      take,
      where: whereConditions,
      orderBy,
      includeDeleted,
    });
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

  // Get deleted users
  async findDeleted(params?: { search?: string }): Promise<User[]> {
    const whereConditions: Prisma.UserWhereInput = { deletedAt: { not: null } };

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(params?.search, [
      'name',
      'email',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('user', {
      where: whereConditions,
      include: {
        posts: true,
        comments: true,
      },
      includeDeleted: true,
    });
  }
}
