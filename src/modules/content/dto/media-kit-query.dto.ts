import { IsOptional, IsString } from 'class-validator';

export class MediaKitQueryDto {
  @IsOptional()
  @IsString()
  locale?: string;
}
