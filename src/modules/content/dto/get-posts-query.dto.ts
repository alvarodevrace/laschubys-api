import { IsOptional, IsNumberString } from 'class-validator';

export class GetPostsQueryDto {
  @IsOptional() @IsNumberString() limit?: string;
}
