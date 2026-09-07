import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CaptureDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  donorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}
