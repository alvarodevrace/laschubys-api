import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminPostsController } from './admin-posts.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminUploadController } from './admin-upload.controller';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [AdminPostsController, AdminProductsController, AdminUploadController],
})
export class AdminModule {}
