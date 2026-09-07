import type {
  Donation,
  DonationGateway,
  DonationStatus,
  DonationTier,
} from './donations.types';

export interface CreateDonationInput {
  id: string;
  tier: DonationTier;
  amountUsd: number;
  currency: string;
  status: DonationStatus;
  gateway: DonationGateway;
  gatewayRef: string | null;
  donorName: string | null;
  message: string | null;
}

export interface DonationsRepository {
  create(input: CreateDonationInput): Promise<Donation>;
  findById(id: string): Promise<Donation | null>;
  findByGatewayRef(gatewayRef: string): Promise<Donation | null>;
  markPaid(
    id: string,
    gatewayRef: string,
    info: { donorName: string | null; message: string | null },
  ): Promise<Donation>;
  /** Admin moderation: move a donation between statuses (e.g. paid -> approved). */
  updateStatus(id: string, status: DonationStatus): Promise<Donation>;
  findApprovedPaginated(
    page: number,
    limit: number,
  ): Promise<{ items: Donation[]; total: number }>;
}

export const DONATIONS_REPOSITORY = 'DONATIONS_REPOSITORY';
