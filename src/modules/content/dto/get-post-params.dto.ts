import { IsString, MinLength } from 'class-validator';

export class GetPostParamsDto {
  @IsString() @MinLength(1) slug!: string;
}
