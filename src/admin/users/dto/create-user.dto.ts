import { IsEmail, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { IsOptionalEnum } from '../../../common/decorators/validation.decorators';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name?: string;

  @IsString()
  password: string;

  @IsOptionalEnum(Role)
  role?: Role;
}
