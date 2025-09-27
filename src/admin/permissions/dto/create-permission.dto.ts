import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  resource: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  pathPattern?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
