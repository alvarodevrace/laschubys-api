import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsIn,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional() @IsString() id?: string;
  @IsString() name!: string;
  @Type(() => Number) @IsNumber() price!: number;
  @IsIn(['owned', 'affiliate']) source!: 'owned' | 'affiliate';
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() copy?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(20000) details?: string;
  @IsOptional() @IsString() @MaxLength(10000) specifications?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() affiliate_url?: string;
  @IsOptional() @IsString() shipping_note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['physical', 'link']) productType?: 'physical' | 'link';
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be a valid slug' })
  slug?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @IsOptional() @IsIn(['owned', 'affiliate']) source?: 'owned' | 'affiliate';
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() copy?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(20000) details?: string;
  @IsOptional() @IsString() @MaxLength(10000) specifications?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() affiliate_url?: string;
  @IsOptional() @IsString() shipping_note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['physical', 'link']) productType?: 'physical' | 'link';
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be a valid slug' })
  slug?: string;
}
