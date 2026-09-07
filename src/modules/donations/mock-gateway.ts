import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TIER_AMOUNTS } from './donations.types';
import type { DonationTier } from './donations.types';
import type {
  PaymentCaptureResult,
  PaymentGateway,
  PaymentOrder,
} from './payment-gateway.interface';

/**
 * MockGateway — Sprint 1 only (kept for local dev when PAYPAL_MODE=disabled).
 * Simulates the PayPal flow entirely in memory: short latency, 100% approval,
 * and it only allows capturing orders that it created itself. Zero real PayPal.
 */
@Injectable()
export class MockGateway implements PaymentGateway {
  readonly name = 'mock' as const;

  private readonly orders = new Map<string, PaymentOrder>();

  async createOrder(
    tier: DonationTier,
    options?: { customId?: string },
  ): Promise<PaymentOrder> {
    await this.simulateProcessing();

    // The service passes the pending donation id as customId; use it as the
    // order id so capture() can resolve the order by the same key.
    const orderId = options?.customId ?? randomUUID();
    const order: PaymentOrder = {
      orderId,
      tier,
      amountUsd: TIER_AMOUNTS[tier],
      currency: 'USD',
      status: 'pending',
    };
    this.orders.set(order.orderId, order);
    return order;
  }

  async capture(orderId: string): Promise<PaymentCaptureResult> {
    await this.simulateProcessing();

    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Mock order ${orderId} not found`);
    }

    return { status: 'COMPLETED', gatewayRef: `mock_${orderId}`, donationId: order.orderId };
  }

  private simulateProcessing(): Promise<void> {
    const delay = 250 + Math.floor(Math.random() * 200);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
