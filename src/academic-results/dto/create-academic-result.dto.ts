import { IsString, IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';

export class CreateAcademicResultDto {
  @IsString()
  studentId: string;

  @IsString()
  subject: string;

  @IsString()
  semester: string;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  score: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  teacherName?: string;
}

