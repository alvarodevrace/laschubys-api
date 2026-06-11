import { IsOptional, IsNumberString, Max } from 'class-validator';

export class GetPostsQueryDto {
  @IsOptional() @IsNumberString() @Max(100) limit?: string;
}
