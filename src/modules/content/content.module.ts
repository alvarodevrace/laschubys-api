import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ContentController, AdminSocialMetricsController } from './content.controller';
import { MediaKitService } from './media-kit.service';
import { MediaKitPdfService } from './media-kit-pdf.service';
import { SocialMetricsService } from './social-metrics.service';
import { SocialMetricsAdminService } from './social-metrics-admin.service';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [ContentController, AdminSocialMetricsController],
  providers: [MediaKitService, MediaKitPdfService, SocialMetricsService, SocialMetricsAdminService],
})
export class ContentModule {}
