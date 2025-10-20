import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterParentDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  address?: string;
}

