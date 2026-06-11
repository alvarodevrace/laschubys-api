import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() productId!: string;
  @IsString() name!: string;
  @IsNumber() @Min(1) quantity!: number;
  @IsNumber() @Min(0) price!: number;
}

export class CreateOrderDto {
  @IsString() name!: string;
  @IsString() phone!: string;
  @IsEmail() email!: string;
  @IsString() province!: string;
  @IsString() address!: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items!: OrderItemDto[];
}
