import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class UserRolesService {
  constructor(private readonly prisma: PrismaService) {}

  // Get user with all roles and permissions
  async getUserWithRolesAndPermissions(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  // Get user permissions (flattened from roles)
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getUserWithRolesAndPermissions(userId);
    
    const permissions: string[] = user.userRoles
      .flatMap(ur => ur.role.rolePermissions)
      .map(rp => rp.permission.name);

    // Remove duplicates
    return [...new Set(permissions)];
  }

  // Check if user has specific permission
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: userId,
        role: {
          rolePermissions: {
            some: {
              permission: { name: permissionName },
            },
          },
        },
      },
    });

    return !!userRole;
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: userId,
        role: {
          rolePermissions: {
            some: {
              permission: { 
                name: { in: permissionNames },
              },
            },
          },
        },
      },
    });

    return !!userRole;
  }

  // Check if user has all of the specified permissions
  async hasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissionNames.every(permission => userPermissions.includes(permission));
  }

  // Get user roles
  async getUserRoles(userId: string): Promise<any[]> {
    const user = await this.getUserWithRolesAndPermissions(userId);
    return user.userRoles.map(ur => ur.role);
  }

  // Assign single role to user
  async assignRole(userId: string, assignRoleDto: AssignRoleDto): Promise<UserRole> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if role exists
    const role = await this.prisma.roleModel.findUnique({
      where: { id: assignRoleDto.roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${assignRoleDto.roleId} not found`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: assignRoleDto.roleId,
        },
      },
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId: assignRoleDto.roleId,
      },
    });
  }

  // Assign multiple roles to user
  async assignRoles(userId: string, assignRolesDto: AssignRolesDto): Promise<UserRole[]> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if all roles exist
    const roles = await this.prisma.roleModel.findMany({
      where: { id: { in: assignRolesDto.roleIds } },
    });
    if (roles.length !== assignRolesDto.roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    // Remove existing assignments
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // Create new assignments
    const userRoles = assignRolesDto.roleIds.map(roleId => ({
      userId,
      roleId,
    }));

    await this.prisma.userRole.createMany({
      data: userRoles,
    });

    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });
  }

  // Remove role from user
  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }

  // Remove all roles from user
  async removeAllRoles(userId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });
  }

  // Get users with specific role
  async getUsersWithRole(roleId: string): Promise<any[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // Legacy role
          },
        },
      },
    });

    return userRoles.map(ur => ur.user);
  }

  // Get users with specific permission
  async getUsersWithPermission(permissionName: string): Promise<any[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        role: {
          rolePermissions: {
            some: {
              permission: { name: permissionName },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // Legacy role
          },
        },
      },
    });

    // Remove duplicates
    const uniqueUsers = userRoles.reduce((acc: any[], ur) => {
      if (!acc.find(u => u.id === ur.user.id)) {
        acc.push(ur.user);
      }
      return acc;
    }, []);

    return uniqueUsers;
  }

  // Get role statistics
  async getRoleStatistics(): Promise<any> {
    const roles = await this.prisma.roleModel.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      userCount: role._count.userRoles,
      permissionCount: role._count.rolePermissions,
    }));
  }

  // Get permission statistics
  async getPermissionStatistics(): Promise<any> {
    const permissions = await this.prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });

    return permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      displayName: permission.displayName,
      resource: permission.resource,
      action: permission.action,
      roleCount: permission._count.rolePermissions,
    }));
  }
}
