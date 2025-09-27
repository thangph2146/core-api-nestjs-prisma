import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { UserRolesService } from './user-roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';

@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  // Get user with all roles and permissions
  @Get('user/:userId')
  async getUserWithRolesAndPermissions(@Param('userId') userId: string): Promise<any> {
    return this.userRolesService.getUserWithRolesAndPermissions(userId);
  }

  // Get user permissions
  @Get('user/:userId/permissions')
  async getUserPermissions(@Param('userId') userId: string): Promise<string[]> {
    return this.userRolesService.getUserPermissions(userId);
  }

  // Check if user has specific permission
  @Get('user/:userId/has-permission/:permissionName')
  async hasPermission(
    @Param('userId') userId: string,
    @Param('permissionName') permissionName: string,
  ): Promise<{ hasPermission: boolean }> {
    const hasPermission = await this.userRolesService.hasPermission(userId, permissionName);
    return { hasPermission };
  }

  // Check if user has any of the specified permissions
  @Post('user/:userId/has-any-permission')
  async hasAnyPermission(
    @Param('userId') userId: string,
    @Body() body: { permissions: string[] },
  ): Promise<{ hasAnyPermission: boolean }> {
    const hasAnyPermission = await this.userRolesService.hasAnyPermission(userId, body.permissions);
    return { hasAnyPermission };
  }

  // Check if user has all of the specified permissions
  @Post('user/:userId/has-all-permissions')
  async hasAllPermissions(
    @Param('userId') userId: string,
    @Body() body: { permissions: string[] },
  ): Promise<{ hasAllPermissions: boolean }> {
    const hasAllPermissions = await this.userRolesService.hasAllPermissions(userId, body.permissions);
    return { hasAllPermissions };
  }

  // Get user roles
  @Get('user/:userId/roles')
  async getUserRoles(@Param('userId') userId: string): Promise<any[]> {
    return this.userRolesService.getUserRoles(userId);
  }

  // Assign single role to user
  @Post('user/:userId/assign-role')
  async assignRole(
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
  ): Promise<any> {
    return this.userRolesService.assignRole(userId, assignRoleDto);
  }

  // Assign multiple roles to user
  @Post('user/:userId/assign-roles')
  async assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ): Promise<any[]> {
    return this.userRolesService.assignRoles(userId, assignRolesDto);
  }

  // Remove role from user
  @Delete('user/:userId/role/:roleId')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<{ message: string }> {
    await this.userRolesService.removeRole(userId, roleId);
    return { message: 'Role removed successfully' };
  }

  // Remove all roles from user
  @Delete('user/:userId/roles')
  async removeAllRoles(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.userRolesService.removeAllRoles(userId);
    return { message: 'All roles removed successfully' };
  }

  // Get users with specific role
  @Get('role/:roleId/users')
  async getUsersWithRole(@Param('roleId') roleId: string): Promise<any[]> {
    return this.userRolesService.getUsersWithRole(roleId);
  }

  // Get users with specific permission
  @Get('permission/:permissionName/users')
  async getUsersWithPermission(@Param('permissionName') permissionName: string): Promise<any[]> {
    return this.userRolesService.getUsersWithPermission(permissionName);
  }

  // Get role statistics
  @Get('statistics/roles')
  async getRoleStatistics(): Promise<any[]> {
    return this.userRolesService.getRoleStatistics();
  }

  // Get permission statistics
  @Get('statistics/permissions')
  async getPermissionStatistics(): Promise<any[]> {
    return this.userRolesService.getPermissionStatistics();
  }
}
