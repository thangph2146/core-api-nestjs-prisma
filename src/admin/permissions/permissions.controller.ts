import { Controller, Get, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { BaseController } from '../../common/base.controller';
import { Permission } from '@prisma/client';

@Controller('permissions')
export class PermissionsController extends BaseController<
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto
> {
  constructor(private readonly permissionsService: PermissionsService) {
    super(permissionsService, {
      modelName: 'permission',
      createDto: CreatePermissionDto,
      updateDto: UpdatePermissionDto,
    });
  }

  // Get roles that have this permission
  @Get(':id/roles')
  async getRoles(@Param('id') id: string): Promise<any[]> {
    return this.permissionsService.getRoles(id);
  }

  // Get unique resources
  @Get('resources/list')
  async getResources(): Promise<string[]> {
    return this.permissionsService.getResources();
  }

  // Get unique actions
  @Get('actions/list')
  async getActions(): Promise<string[]> {
    return this.permissionsService.getActions();
  }

  // Get permissions by resource
  @Get('resource/:resource')
  async getPermissionsByResource(
    @Param('resource') resource: string,
  ): Promise<Permission[]> {
    return this.permissionsService.getPermissionsByResource(resource);
  }

  // Get permissions by action
  @Get('action/:action')
  async getPermissionsByAction(
    @Param('action') action: string,
  ): Promise<Permission[]> {
    return this.permissionsService.getPermissionsByAction(action);
  }

  // Get permissions by resource and action
  @Get('resource/:resource/action/:action')
  async getPermissionsByResourceAndAction(
    @Param('resource') resource: string,
    @Param('action') action: string,
  ): Promise<Permission[]> {
    return this.permissionsService.findByResourceAndAction(resource, action);
  }
}
