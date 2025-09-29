import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission, Prisma } from '@prisma/client';
import { BaseService } from '../../common/base.service';

@Injectable()
export class PermissionsService extends BaseService<Permission, CreatePermissionDto, UpdatePermissionDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'permission',
      searchFields: ['name', 'displayName', 'description', 'resource', 'action'],
      defaultInclude: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        name: { type: 'text' },
        displayName: { type: 'text' },
        resource: { type: 'select' },
        action: { type: 'select' },
        isActive: { type: 'select' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        ...createPermissionDto,
        isActive: createPermissionDto.isActive ?? true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PermissionWhereUniqueInput;
    where?: Prisma.PermissionWhereInput;
    orderBy?: Prisma.PermissionOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<Permission[]> {
    const { skip, take, where, orderBy, includeDeleted, search, columnFilters } = params || {};

    // Use the new paginated method for consistency
    const result = await this.findManyPaginatedWithFilters('permission', {
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

  async findOne(id: string, includeDeleted: boolean = false): Promise<Permission> {
    try {
      return await this.findUnique(
        'permission',
        { id },
        {
          rolePermissions: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          },
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { resource },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByAction(action: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { action },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { 
        resource,
        action,
      },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    await this.findOne(id); // Check if permission exists
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  // Soft delete
  async remove(id: string): Promise<Permission> {
    await this.findOne(id); // Check if permission exists
    return this.softDelete('permission', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<Permission> {
    await this.findOne(id); // Check if permission exists
    return this.hardDeleteRecord('permission', id);
  }

  // Restore
  async restore(id: string): Promise<Permission> {
    return this.restoreRecord('permission', id);
  }

  // Role management
  async getRoles(permissionId: string): Promise<any[]> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    return permission.rolePermissions.map(rp => rp.role);
  }

  // Get unique resources
  async getResources(): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      select: { resource: true },
      distinct: ['resource'],
    });
    return permissions.map(p => p.resource);
  }

  // Get unique actions
  async getActions(): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      select: { action: true },
      distinct: ['action'],
    });
    return permissions.map(p => p.action);
  }

  // Get permissions by resource
  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.findByResource(resource);
  }

  // Get permissions by action
  async getPermissionsByAction(action: string): Promise<Permission[]> {
    return this.findByAction(action);
  }

  // Get deleted permissions
  async findDeleted(params?: { 
    search?: string; 
    columnFilters?: Record<string, string>;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Permission[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.findManyPaginatedWithFilters('permission', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      where: { deletedAt: { not: null } },
      includeDeleted: true,
      search: params?.search,
      columnFilters: params?.columnFilters,
    });
  }
}
