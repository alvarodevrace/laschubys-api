import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ContentController } from './content.controller';
import { MediaKitService } from './media-kit.service';
import { MediaKitPdfService } from './media-kit-pdf.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ContentController],
  providers: [MediaKitService, MediaKitPdfService],
})
export class ContentModule {}
