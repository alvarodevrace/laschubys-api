import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminPostsController } from './admin-posts.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminUploadController } from './admin-upload.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [AdminPostsController, AdminProductsController, AdminUploadController],
})
export class AdminModule {}
