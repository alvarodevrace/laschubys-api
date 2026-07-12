import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { HealthModule } from './modules/health/health.module';
import { ContentModule } from './modules/content/content.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { ContactModule } from './modules/contact/contact.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 60000, max: 200 }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'auth', ttl: 60000, limit: 10 },
      { name: 'checkout', ttl: 60000, limit: 5 },
    ]),
    SupabaseModule,
    AuthModule,
    CommentsModule,
    HealthModule,
    ContentModule,
    CheckoutModule,
    ContactModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
