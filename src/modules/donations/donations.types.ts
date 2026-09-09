// Tier constants (single source of truth for allowed values and prices).
export const DONATION_TIERS = {
  CROQUETA: 'croqueta',
  CHURU: 'churu',
  SALMON: 'salmon',
} as const;

export type DonationTier = (typeof DONATION_TIERS)[keyof typeof DONATION_TIERS];

// Amounts are fixed SERVER-SIDE. The client only sends the tier.
export const TIER_AMOUNTS: Record<DonationTier, number> = {
  croqueta: 5,
  churu: 10,
  salmon: 15,
};

export const DONATION_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DonationStatus = (typeof DONATION_STATUSES)[keyof typeof DONATION_STATUSES];

export const DONATION_GATEWAYS = {
  MOCK: 'mock',
  PAYPAL: 'paypal',
} as const;

export type DonationGateway = (typeof DONATION_GATEWAYS)[keyof typeof DONATION_GATEWAYS];

export interface Donation {
  id: string;
  tier: DonationTier;
  amountUsd: number;
  currency: string;
  donorName: string | null;
  message: string | null;
  status: DonationStatus;
  gateway: DonationGateway;
  gatewayRef: string | null;
  gatewayOrderId: string | null;
  createdAt: string;
}

// Public wall view: never expose internal status/gateway fields.
export type DonationView = Pick<
  Donation,
  'id' | 'tier' | 'amountUsd' | 'currency' | 'donorName' | 'message' | 'createdAt'
>;
