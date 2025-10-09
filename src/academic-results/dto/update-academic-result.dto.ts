import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicResultDto } from './create-academic-result.dto';

export class UpdateAcademicResultDto extends PartialType(CreateAcademicResultDto) {}

