import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class UpdateMediaKitConfigDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsObject()
  data!: Record<string, unknown>;
}
