import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SitemapController } from './sitemap.controller';

@Module({ controllers: [HealthController, SitemapController] })
export class HealthModule {}
