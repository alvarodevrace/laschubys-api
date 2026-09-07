import { IsNumberString, IsOptional } from 'class-validator';

export class PublicQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
