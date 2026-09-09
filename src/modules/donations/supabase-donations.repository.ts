import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Donation, DonationStatus } from './donations.types';
import type { CreateDonationInput, DonationsRepository } from './donations-repository.interface';

// PostgREST row shape for laschubys.donations (see shared/types/supabase.ts).
type DonationRow = {
  id: string;
  tier: string;
  amount_usd: number;
  currency: string;
  donor_name: string | null;
  message: string | null;
  status: string;
  gateway: string;
  gateway_ref: string | null;
  gateway_order_id: string | null;
  created_at: string;
};

function toRow(input: CreateDonationInput) {
  return {
    id: input.id,
    tier: input.tier,
    amount_usd: input.amountUsd,
    currency: input.currency,
    donor_name: input.donorName,
    message: input.message,
    status: input.status,
    gateway: input.gateway,
    gateway_ref: input.gatewayRef,
    gateway_order_id: input.gatewayOrderId ?? null,
  };
}

function fromRow(row: DonationRow): Donation {
  return {
    id: row.id,
    tier: row.tier as Donation['tier'],
    amountUsd: Number(row.amount_usd),
    currency: row.currency,
    donorName: row.donor_name,
    message: row.message,
    status: row.status as Donation['status'],
    gateway: row.gateway as Donation['gateway'],
    gatewayRef: row.gateway_ref,
    gatewayOrderId: row.gateway_order_id,
    createdAt: row.created_at,
  };
}

/**
 * SupabaseDonationsRepository — Sprint 2.
 *
 * Backed by the real `laschubys.donations` table (already migrated, see
 * supabase/migrations/20260907000000_create_donations.sql). Writes use the
 * service_role client; reads that power the public wall filter on
 * `status = 'approved'` explicitly (defense-in-depth, not just RLS).
 *
 * Idempotency: `gateway_ref` is UNIQUE. `create()` uses
 * `ON CONFLICT (gateway_ref) DO NOTHING` so a duplicated webhook event never
 * creates a second row.
 */
@Injectable()
export class SupabaseDonationsRepository implements DonationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async create(input: CreateDonationInput): Promise<Donation> {
    const { data, error } = await this.supabase.admin
      .from('donations')
      .upsert(toRow(input), { onConflict: 'gateway_ref', ignoreDuplicates: true })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create donation: ${error.message}`);
    }
    // When the insert is ignored because gateway_ref already exists, PostgREST
    // returns no row (or .single() errors). Recover the existing row.
    if (!data) {
      const existing = input.gatewayRef ? await this.findByGatewayRef(input.gatewayRef) : null;
      if (existing) {
        return existing;
      }
      throw new Error('Failed to create donation: no row returned');
    }
    return fromRow(data as DonationRow);
  }

  async findById(id: string): Promise<Donation | null> {
    const { data, error } = await this.supabase.admin
      .from('donations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find donation: ${error.message}`);
    }
    return data ? fromRow(data as DonationRow) : null;
  }

  async findByGatewayRef(gatewayRef: string): Promise<Donation | null> {
    const { data, error } = await this.supabase.admin
      .from('donations')
      .select('*')
      .eq('gateway_ref', gatewayRef)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find donation by gateway ref: ${error.message}`);
    }
    return data ? fromRow(data as DonationRow) : null;
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<Donation | null> {
    const { data, error } = await this.supabase.admin
      .from('donations')
      .select('*')
      .eq('gateway_order_id', gatewayOrderId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find donation by gateway order id: ${error.message}`);
    }
    return data ? fromRow(data as DonationRow) : null;
  }

  async markPaid(
    id: string,
    gatewayRef: string,
    info: { donorName: string | null; message: string | null },
  ): Promise<Donation> {
    const { data, error } = await this.supabase.admin
      .from('donations')
      .update({
        status: 'paid',
        gateway_ref: gatewayRef,
        donor_name: info.donorName,
        message: info.message,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark donation paid: ${error.message}`);
    }
    return fromRow(data as DonationRow);
  }

  async updateStatus(id: string, status: DonationStatus): Promise<Donation> {
    const { data, error } = await this.supabase.admin
      .from('donations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update donation status: ${error.message}`);
    }
    return fromRow(data as DonationRow);
  }

  async findApprovedPaginated(
    page: number,
    limit: number,
  ): Promise<{ items: Donation[]; total: number }> {
    const from = (page - 1) * limit;

    // Explicit `status = 'approved'` filter: the public wall must never rely on
    // RLS alone to hide non-approved rows.
    const { data, error, count } = await this.supabase.admin
      .from('donations')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      throw new Error(`Failed to list approved donations: ${error.message}`);
    }
    return {
      items: (data ?? []).map((row) => fromRow(row as DonationRow)),
      total: count ?? 0,
    };
  }
}
