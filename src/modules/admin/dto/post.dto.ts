import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreatePostDto {
  @IsString() slug!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsArray() content?: string[];
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() read_time?: string;
  @IsOptional() @IsString() cover_image?: string;
  @IsString() author!: string;
  @IsOptional() @IsDateString() published_at?: string;
}

export class UpdatePostDto {
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsArray() content?: string[];
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() read_time?: string;
  @IsOptional() @IsString() cover_image?: string;
  @IsOptional() @IsString() author?: string;
  @IsOptional() @IsDateString() published_at?: string | null;
}
