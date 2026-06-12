import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsNotEmpty,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() phone!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() province!: string;
  @IsString() @IsNotEmpty() address!: string;
}

class OrderItemDto {
  @IsString() @IsNotEmpty() id!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsNumber() @Min(1) qty!: number;
  @IsNumber() @Min(0) price!: number;
  @IsString() @IsOptional() source?: 'owned' | 'affiliate';
}

export class CreateOrderDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsNumber()
  @Min(0)
  total!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
