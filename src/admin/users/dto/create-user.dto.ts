import { IsEmail, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import {
  IsOptionalBoolean,
  IsOptionalEnum,
  IsOptionalString,
} from '../../../common/decorators/validation.decorators';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptionalString()
  name?: string;

  @IsString()
  password: string;

  @IsOptionalEnum(Role)
  role?: Role;

  @IsOptionalString()
  bio?: string;

  @IsOptionalString()
  avatar?: string;

  @IsOptionalBoolean()
  emailVerified?: boolean;
}
