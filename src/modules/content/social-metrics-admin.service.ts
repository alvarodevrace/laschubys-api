import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../../shared/types/supabase';
import { CreateSocialMetricDto } from './dto/create-social-metric.dto';
import { UpdateSocialMetricDto } from './dto/update-social-metric.dto';
import { GetSocialMetricsQueryDto } from './dto/get-social-metrics-query.dto';

type SocialMetricRow = Database['laschubys']['Tables']['social_metrics']['Row'];
type SocialMetricInsert = Database['laschubys']['Tables']['social_metrics']['Insert'];
type SocialMetricUpdate = Database['laschubys']['Tables']['social_metrics']['Update'];
type Json = Database['laschubys']['Tables']['social_metrics']['Row']['metadata'];

export interface SocialMetricsListResponse {
  data: SocialMetricView[];
  total: number;
  limit: number;
  offset: number;
}

export interface SocialMetricSnapshotItem {
  platform: string;
  accountId: string;
  metrics: Record<string, SocialMetricView>;
  recordedAt: string | null;
}

export interface SocialMetricView {
  id: string;
  platform: string;
  accountId: string;
  metricType: string;
  valueNumeric: number | null;
  valueText: string | null;
  period: string | null;
  recordedAt: string;
  externalId: string | null;
  metadata: Json;
  createdAt: string;
}

export interface SocialMetricHistoryPoint {
  recordedAt: string;
  value: number | null;
  valueText: string | null;
}

export interface SocialMetricHistoryGroup {
  platform: string;
  accountId: string;
  metricType: string;
  points: SocialMetricHistoryPoint[];
}

export interface SocialMetricHistoryResponse {
  data: SocialMetricHistoryGroup[];
}

@Injectable()
export class SocialMetricsAdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAllMetrics(filters: GetSocialMetricsQueryDto): Promise<SocialMetricsListResponse> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    let query = this.supabase.admin
      .from('social_metrics')
      .select('*', { count: 'exact' })
      .order('recorded_at', { ascending: false });

    if (filters.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters.metricType) {
      query = query.eq('metric_type', filters.metricType);
    }

    if (filters.from) {
      query = query.gte('recorded_at', filters.from);
    }

    if (filters.to) {
      query = query.lte('recorded_at', filters.to);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data: ((data ?? []) as SocialMetricRow[]).map((row) => this.toView(row)),
      total: count ?? 0,
      limit,
      offset,
    };
  }

  async getLatestSnapshot(): Promise<SocialMetricSnapshotItem[]> {
    const { data, error } = await this.supabase.admin
      .from('social_metrics')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const platforms = new Map<string, SocialMetricSnapshotItem>();
    for (const raw of data ?? []) {
      const row = raw as SocialMetricRow;
      let item = platforms.get(row.platform);
      if (!item) {
        item = {
          platform: row.platform,
          accountId: row.account_id,
          metrics: {},
          recordedAt: row.recorded_at,
        };
        platforms.set(row.platform, item);
      }

      if (!item.metrics[row.metric_type]) {
        item.metrics[row.metric_type] = this.toView(row);
        if (item.recordedAt && row.recorded_at > item.recordedAt) {
          item.recordedAt = row.recorded_at;
        }
      }
    }

    return Array.from(platforms.values());
  }

  private toView(row: SocialMetricRow): SocialMetricView {
    return {
      id: row.id,
      platform: row.platform,
      accountId: row.account_id,
      metricType: row.metric_type,
      valueNumeric: row.value_numeric,
      valueText: row.value_text,
      period: row.period,
      recordedAt: row.recorded_at,
      externalId: row.external_id,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }

  async getHistory(): Promise<SocialMetricHistoryResponse> {
    const allowedPlatforms = ['instagram', 'facebook', 'tiktok'];

    const { data, error } = await this.supabase.admin
      .from('social_metrics')
      .select('*')
      .in('platform', allowedPlatforms)
      .order('recorded_at', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const groups = new Map<string, SocialMetricHistoryGroup>();
    for (const raw of data ?? []) {
      const row = raw as SocialMetricRow;
      const key = `${row.platform}:${row.metric_type}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          platform: row.platform,
          accountId: row.account_id,
          metricType: row.metric_type,
          points: [],
        };
        groups.set(key, group);
      }

      group.points.push({
        recordedAt: row.recorded_at,
        value: row.value_numeric,
        valueText: row.value_text,
      });
    }

    return {
      data: Array.from(groups.values()).sort((a, b) => {
        if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
        return a.metricType.localeCompare(b.metricType);
      }),
    };
  }

  async getMetricsByPlatform(platform: string): Promise<SocialMetricView[]> {
    const { data, error } = await this.supabase.admin
      .from('social_metrics')
      .select('*')
      .eq('platform', platform)
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return ((data ?? []) as SocialMetricRow[]).map((row) => this.toView(row));
  }

  async createMetric(dto: CreateSocialMetricDto): Promise<SocialMetricView> {
    const payload: SocialMetricInsert = {
      platform: dto.platform,
      account_id: dto.accountId,
      metric_type: dto.metricType,
      value_numeric: dto.valueNumeric ?? null,
      value_text: dto.valueText ?? null,
      period: dto.period ?? null,
      recorded_at: dto.recordedAt,
      external_id: dto.externalId ?? null,
      metadata: this.normalizeMetadata(dto.metadata),
    };

    const { data, error } = await this.supabase.admin
      .from('social_metrics')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.toView(data as SocialMetricRow);
  }

  async updateMetric(id: string, dto: UpdateSocialMetricDto): Promise<SocialMetricView> {
    const payload = this.toUpdatePayload(dto);

    const { data, error } = await this.supabase.admin
      .from('social_metrics')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Métrica no encontrada');
    }

    return this.toView(data as SocialMetricRow);
  }

  async deleteMetric(id: string): Promise<{ success: boolean }> {
    const { error } = await this.supabase.admin.from('social_metrics').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true };
  }

  private toUpdatePayload(dto: UpdateSocialMetricDto): SocialMetricUpdate {
    const payload: SocialMetricUpdate = {};

    if (dto.platform !== undefined) payload.platform = dto.platform;
    if (dto.accountId !== undefined) payload.account_id = dto.accountId;
    if (dto.metricType !== undefined) payload.metric_type = dto.metricType;
    if (dto.valueNumeric !== undefined) payload.value_numeric = dto.valueNumeric;
    if (dto.valueText !== undefined) payload.value_text = dto.valueText;
    if (dto.period !== undefined) payload.period = dto.period;
    if (dto.recordedAt !== undefined) payload.recorded_at = dto.recordedAt;
    if (dto.externalId !== undefined) payload.external_id = dto.externalId;
    if (dto.metadata !== undefined) payload.metadata = this.normalizeMetadata(dto.metadata);

    return payload;
  }

  private normalizeMetadata(value: Record<string, unknown> | undefined): Json {
    if (value === undefined || value === null) {
      return {};
    }

    return value as Json;
  }
}
