import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../../shared/types/supabase';
import type { MediaKitMetric } from './media-kit.service';

type SocialMetricRow = Database['laschubys']['Tables']['social_metrics']['Row'];
type Json = Database['laschubys']['Tables']['social_metrics']['Row']['metadata'];

const NETWORK_TITLES: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const METRIC_LABELS: Record<string, string> = {
  followers: 'seguidores',
  likes: 'likes',
  reach: 'alcance',
  impressions: 'impresiones',
  engagement: 'engagement orgánico',
  profile_views: 'visitas al perfil',
  comments: 'comentarios',
  shares: 'compartidos',
  video_views: 'reproducciones',
};

@Injectable()
export class SocialMetricsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getLatestByPlatform(platform: string): Promise<SocialMetricRow | null> {
    const { data, error } = await this.supabase.anon
      .from('social_metrics')
      .select('*')
      .eq('platform', platform)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as SocialMetricRow;
  }

  async getMetricsForMediaKit(): Promise<MediaKitMetric[]> {
    const { data, error } = await this.supabase.anon
      .from('social_metrics')
      .select('*')
      .in('metric_type', ['followers', 'engagement'])
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (error || !data?.length) {
      return [];
    }

    const latestByPlatform = new Map<string, SocialMetricRow>();
    for (const raw of data) {
      const row = raw as SocialMetricRow;
      if (!latestByPlatform.has(row.platform)) {
        latestByPlatform.set(row.platform, row);
      }
    }

    return Array.from(latestByPlatform.values()).map((row) => this.toMediaKitMetric(row));
  }

  private toMediaKitMetric(row: SocialMetricRow): MediaKitMetric {
    const network = NETWORK_TITLES[row.platform.toLowerCase()] ?? this.capitalize(row.platform);
    const handle = row.account_id;
    const value = this.resolveValue(row);
    const label = METRIC_LABELS[row.metric_type.toLowerCase()] ?? row.metric_type;
    const engagement = this.readMetadataString(row.metadata, 'engagement');
    const href = this.readMetadataString(row.metadata, 'href');

    return {
      network,
      handle,
      value,
      label,
      engagement,
      href,
    };
  }

  private resolveValue(row: SocialMetricRow): string {
    if (row.value_text) {
      return row.value_text;
    }

    if (row.value_numeric !== null && row.value_numeric !== undefined) {
      return this.formatCount(row.value_numeric);
    }

    return '-';
  }

  private formatCount(value: number): string {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private readMetadataString(metadata: Json, key: string): string | undefined {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return undefined;
    }

    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
}
