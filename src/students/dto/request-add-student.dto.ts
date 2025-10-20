import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '@prisma/client';

export class RequestAddStudentDto {
  @IsString()
  fullName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsString()
  studentCode!: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}