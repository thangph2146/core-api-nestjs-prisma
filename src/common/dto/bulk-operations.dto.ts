import { IsArray, IsString } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class BulkRestoreDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class BulkHardDeleteDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
