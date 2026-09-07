import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class WebhookAmountDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  currency_code?: string;
}

export class WebhookResourceDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  custom_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookAmountDto)
  amount?: WebhookAmountDto;
}

/**
 * Minimal webhook payload DTO. Real signature verification and full field
 * compatibility are handled in Sprint 2; here we only validate field presence.
 */
export class WebhookPaypalDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  create_time?: string;

  @IsOptional()
  @IsString()
  resource_type?: string;

  @IsString()
  @IsNotEmpty()
  event_type!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  links?: unknown[];

  @IsDefined()
  @ValidateNested()
  @Type(() => WebhookResourceDto)
  resource!: WebhookResourceDto;
}
