import { IsString, MinLength } from 'class-validator';

export class LoginParentDto {
  @IsString()
  emailOrPhone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

