import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { BaseController } from '../../common/base.controller';
import { RoleModel } from '@prisma/client';

@Controller('roles')
export class RolesController extends BaseController<
  RoleModel,
  CreateRoleDto,
  UpdateRoleDto
> {
  constructor(private readonly rolesService: RolesService) {
    super(rolesService, {
      modelName: 'role',
      createDto: CreateRoleDto,
      updateDto: UpdateRoleDto,
    });
  }

  // Permission management endpoints
  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<RoleModel> {
    return this.rolesService.assignPermissions(id, assignPermissionsDto);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string): Promise<any[]> {
    return this.rolesService.getPermissions(id);
  }

  @Post(':id/permissions/:permissionId')
  async addPermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleModel> {
    return this.rolesService.addPermission(roleId, permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  async removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleModel> {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  // User management endpoints
  @Get(':id/users')
  async getUsers(@Param('id') id: string): Promise<any[]> {
    return this.rolesService.getUsers(id);
  }

  @Post(':id/users/:userId')
  async assignUserToRole(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
  ): Promise<RoleModel> {
    return this.rolesService.assignUserToRole(roleId, userId);
  }

  @Delete(':id/users/:userId')
  async removeUserFromRole(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
  ): Promise<RoleModel> {
    return this.rolesService.removeUserFromRole(roleId, userId);
  }
}
