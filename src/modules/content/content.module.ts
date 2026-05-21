import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ContentController } from './content.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [ContentController],
})
export class ContentModule {}
