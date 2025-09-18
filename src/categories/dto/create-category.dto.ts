import { IsString } from 'class-validator';
import { IsOptionalString } from '../../common/decorators/validation.decorators';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptionalString()
  description?: string;
}
