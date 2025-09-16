import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name?: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
