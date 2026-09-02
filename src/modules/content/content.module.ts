import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ContentController } from './content.controller';
import { AdminMediaKitController } from './admin-media-kit.controller';
import { MediaKitService } from './media-kit.service';
import { MediaKitPdfService } from './media-kit-pdf.service';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [ContentController, AdminMediaKitController],
  providers: [MediaKitService, MediaKitPdfService],
})
export class ContentModule {}
