import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional() @IsString() id?: string;
  @IsString() name!: string;
  @Type(() => Number) @IsNumber() price!: number;
  @IsIn(['owned', 'affiliate']) source!: 'owned' | 'affiliate';
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() copy?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() affiliate_url?: string;
  @IsOptional() @IsString() shipping_note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @IsOptional() @IsIn(['owned', 'affiliate']) source?: 'owned' | 'affiliate';
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() copy?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() affiliate_url?: string;
  @IsOptional() @IsString() shipping_note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
