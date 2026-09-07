import type { DonationGateway, DonationTier } from './donations.types';

export interface PaymentOrder {
  /** PayPal order id (mock: the internal donation id). Returned to the client. */
  orderId: string;
  tier: DonationTier;
  amountUsd: number;
  currency: string;
  status: 'pending';
  /** PayPal approval redirect URL (only for real PayPal). */
  approvalUrl?: string;
}

export interface PaymentCaptureResult {
  status: 'COMPLETED';
  /** PayPal capture id (mock: `mock_<orderId>`). Used as the donation gateway_ref. */
  gatewayRef: string;
  /**
   * Our internal donation id (the `custom_id` PayPal echoes back). Used by the
   * service to resolve which pending row to mark as paid. Absent for the mock
   * gateway, where the service falls back to `orderId`.
   */
  donationId?: string;
}

export interface WebhookSignatureInput {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
}

export interface PaymentGateway {
  readonly name: DonationGateway;
  createOrder(tier: DonationTier, options?: { customId?: string }): Promise<PaymentOrder>;
  capture(orderId: string): Promise<PaymentCaptureResult>;
  /**
   * Optional: verify an incoming PayPal webhook signature. Only the real
   * PayPalGateway implements this; the mock does not (dev-only path).
   */
  verifyWebhookSignature?(input: WebhookSignatureInput): Promise<boolean>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
