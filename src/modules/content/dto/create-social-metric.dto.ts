import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSocialMetricDto {
  @IsString()
  platform: string;

  @IsString()
  accountId: string;

  @IsString()
  metricType: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valueNumeric?: number;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
