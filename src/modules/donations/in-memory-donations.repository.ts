import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Donation, DonationStatus, DonationTier } from './donations.types';
import type { CreateDonationInput, DonationsRepository } from './donations-repository.interface';

interface SeedEntry {
  donorName: string;
  message: string;
  daysAgo: number;
  amountUsd: number;
  tier: DonationTier;
}

// Seed data to populate the public wall while the Supabase table does not exist yet.
const SEED_APPROVED: SeedEntry[] = [
  {
    donorName: 'María',
    message: 'Para las michis, con amor',
    daysAgo: 12,
    amountUsd: 10,
    tier: 'churu',
  },
  { donorName: 'Carlos', message: 'Churu para todos!', daysAgo: 9, amountUsd: 5, tier: 'croqueta' },
  {
    donorName: 'Lucía',
    message: 'Salmón premium para ellas',
    daysAgo: 6,
    amountUsd: 15,
    tier: 'salmon',
  },
  {
    donorName: 'Andrés',
    message: 'Un abrazo a las chubys',
    daysAgo: 4,
    amountUsd: 5,
    tier: 'croqueta',
  },
  {
    donorName: 'Valentina',
    message: 'Las mejores michis del mundo',
    daysAgo: 2,
    amountUsd: 10,
    tier: 'churu',
  },
  { donorName: 'José', message: 'Michi power', daysAgo: 1, amountUsd: 5, tier: 'croqueta' },
  {
    donorName: 'Fernanda',
    message: 'Colaboración para ellas',
    daysAgo: 0,
    amountUsd: 15,
    tier: 'salmon',
  },
];

function seedApprovedDonations(): Donation[] {
  return SEED_APPROVED.map((entry) => {
    const createdAt = new Date(Date.now() - entry.daysAgo * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: randomUUID(),
      tier: entry.tier,
      amountUsd: entry.amountUsd,
      currency: 'USD',
      donorName: entry.donorName,
      message: entry.message,
      status: 'approved',
      gateway: 'mock',
      gatewayRef: `mock_seed_${randomUUID()}`,
      gatewayOrderId: null,
      createdAt,
    };
  });
}

/**
 * InMemoryDonationsRepository — Sprint 1 only.
 * Keeps all donations in a Map, pre-seeded with approved entries for the wall.
 */
@Injectable()
export class InMemoryDonationsRepository implements DonationsRepository {
  private readonly store = new Map<string, Donation>();

  constructor() {
    for (const donation of seedApprovedDonations()) {
      this.store.set(donation.id, donation);
    }
  }

  async create(input: CreateDonationInput): Promise<Donation> {
    // Idempotency contract: a duplicate gateway_ref (e.g. repeated webhook) must
    // not create a second row. Mirror the Supabase ON CONFLICT DO NOTHING.
    if (input.gatewayRef) {
      const existing = this.findByGatewayRefSync(input.gatewayRef);
      if (existing) {
        return existing;
      }
    }

    const donation: Donation = {
      ...input,
      gatewayOrderId: input.gatewayOrderId ?? null,
      createdAt: new Date().toISOString(),
    };
    this.store.set(donation.id, donation);
    return donation;
  }

  async findById(id: string): Promise<Donation | null> {
    return this.store.get(id) ?? null;
  }

  async findByGatewayRef(gatewayRef: string): Promise<Donation | null> {
    return this.findByGatewayRefSync(gatewayRef);
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<Donation | null> {
    for (const donation of this.store.values()) {
      if (donation.gatewayOrderId === gatewayOrderId) {
        return donation;
      }
    }
    return null;
  }

  async markPaid(
    id: string,
    gatewayRef: string,
    info: { donorName: string | null; message: string | null },
  ): Promise<Donation> {
    const current = this.store.get(id);
    if (!current) {
      throw new NotFoundException(`Donation ${id} not found`);
    }

    const updated: Donation = {
      ...current,
      status: 'paid',
      gatewayRef,
      donorName: info.donorName ?? current.donorName,
      message: info.message ?? current.message,
    };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: DonationStatus): Promise<Donation> {
    const current = this.store.get(id);
    if (!current) {
      throw new NotFoundException(`Donation ${id} not found`);
    }

    const updated: Donation = { ...current, status };
    this.store.set(id, updated);
    return updated;
  }

  async findApprovedPaginated(
    page: number,
    limit: number,
  ): Promise<{ items: Donation[]; total: number }> {
    const approved = [...this.store.values()]
      .filter((donation) => donation.status === 'approved')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = approved.length;
    const start = (page - 1) * limit;
    const items = approved.slice(start, start + limit);
    return { items, total };
  }

  private findByGatewayRefSync(gatewayRef: string): Donation | null {
    for (const donation of this.store.values()) {
      if (donation.gatewayRef === gatewayRef) {
        return donation;
      }
    }
    return null;
  }
}
