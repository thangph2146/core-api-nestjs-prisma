import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { RoleModel, Prisma } from '@prisma/client';
import { BaseService } from '../../common/base.service';

@Injectable()
export class RolesService extends BaseService<RoleModel, CreateRoleDto, UpdateRoleDto> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'roleModel',
      searchFields: ['name', 'displayName', 'description'],
      defaultInclude: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      defaultOrderBy: { createdAt: 'desc' },
      columnFilterConfig: {
        name: { type: 'text' },
        displayName: { type: 'text' },
        isActive: { type: 'select' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
  }

  async create(createRoleDto: CreateRoleDto): Promise<RoleModel> {
    return this.prisma.roleModel.create({
      data: {
        ...createRoleDto,
        isActive: createRoleDto.isActive ?? true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoleModelWhereUniqueInput;
    where?: Prisma.RoleModelWhereInput;
    orderBy?: Prisma.RoleModelOrderByWithRelationInput;
    includeDeleted?: boolean;
    search?: string;
    columnFilters?: Record<string, string>;
  }): Promise<RoleModel[]> {
    const { skip, take, where, orderBy, includeDeleted, search, columnFilters } = params || {};

    // Base where conditions
    const whereConditions: Prisma.RoleModelWhereInput = {
      ...where,
    };

    // Apply column filter conditions
    if (columnFilters) {
      const columnFilterConditions = this.buildColumnFilterConditions(columnFilters);
      Object.assign(whereConditions, columnFilterConditions);
    }

    // Apply search conditions
    const searchConditions = this.buildSearchConditions(search, ['name', 'displayName', 'description']);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('roleModel', {
      skip,
      take,
      where: whereConditions,
      orderBy,
      includeDeleted,
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<RoleModel> {
    try {
      return await this.findUnique(
        'roleModel',
        { id },
        {
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
        includeDeleted,
      );
    } catch {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async findByName(name: string): Promise<RoleModel | null> {
    return this.prisma.roleModel.findUnique({
      where: { name },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleModel> {
    await this.findOne(id); // Check if role exists
    return this.prisma.roleModel.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  // Soft delete
  async remove(id: string): Promise<RoleModel> {
    await this.findOne(id); // Check if role exists
    return this.softDelete('roleModel', id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<RoleModel> {
    await this.findOne(id); // Check if role exists
    return this.hardDeleteRecord('roleModel', id);
  }

  // Restore
  async restore(id: string): Promise<RoleModel> {
    return this.restoreRecord('roleModel', id);
  }

  // Permission management
  async assignPermissions(roleId: string, assignPermissionsDto: AssignPermissionsDto): Promise<RoleModel> {
    await this.findOne(roleId); // Check if role exists

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
    const rolePermissions = assignPermissionsDto.permissionIds.map(permissionId => ({
      roleId,
      permissionId,
    }));

    await this.prisma.rolePermission.createMany({
      data: rolePermissions,
    });

    return this.findOne(roleId);
  }

  async getPermissions(roleId: string): Promise<any[]> {
    const role = await this.prisma.roleModel.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.rolePermissions.map(rp => rp.permission);
  }

  async addPermission(roleId: string, permissionId: string): Promise<RoleModel> {
    await this.findOne(roleId); // Check if role exists

    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    return this.findOne(roleId);
  }

  async removePermission(roleId: string, permissionId: string): Promise<RoleModel> {
    await this.findOne(roleId); // Check if role exists

    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });

    return this.findOne(roleId);
  }

  // User management
  async getUsers(roleId: string): Promise<any[]> {
    const role = await this.prisma.roleModel.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.userRoles.map(ur => ur.user);
  }

  async assignUserToRole(roleId: string, userId: string): Promise<RoleModel> {
    await this.findOne(roleId); // Check if role exists

    await this.prisma.userRole.create({
      data: {
        roleId,
        userId,
      },
    });

    return this.findOne(roleId);
  }

  async removeUserFromRole(roleId: string, userId: string): Promise<RoleModel> {
    await this.findOne(roleId); // Check if role exists

    await this.prisma.userRole.deleteMany({
      where: {
        roleId,
        userId,
      },
    });

    return this.findOne(roleId);
  }

  // Get deleted roles
  async findDeleted(params?: { search?: string }): Promise<RoleModel[]> {
    const whereConditions: Prisma.RoleModelWhereInput = { deletedAt: { not: null } };

    // Add search conditions if search parameter is provided
    const searchConditions = this.buildSearchConditions(params?.search, [
      'name',
      'displayName',
      'description',
    ]);
    if (searchConditions) {
      whereConditions.OR = searchConditions.OR;
    }

    return this.findMany('roleModel', {
      where: whereConditions,
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      includeDeleted: true,
    });
  }
}
