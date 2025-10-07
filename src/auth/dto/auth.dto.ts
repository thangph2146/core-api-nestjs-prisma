import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import {
  IsOptionalString,
  IsOptionalEnum,
} from '../../common/decorators/validation.decorators';

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsOptionalString()
  name?: string;

  @IsOptionalEnum({
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    USER: 'USER',
  })
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'USER';
}

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token phải là chuỗi' })
  refreshToken: string;
}
