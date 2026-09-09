import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { env } from '../../shared/config/env';
import { TIER_AMOUNTS } from './donations.types';
import type { Donation, DonationTier, DonationView } from './donations.types';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import type { PaymentGateway, WebhookSignatureInput } from './payment-gateway.interface';
import { DONATIONS_REPOSITORY } from './donations-repository.interface';
import type { DonationsRepository } from './donations-repository.interface';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { CaptureDto } from './dto/capture.dto';
import type { WebhookPaypalDto } from './dto/webhook-paypal.dto';
import type { PublicQueryDto } from './dto/public-query.dto';

export interface WebhookInput extends WebhookSignatureInput {
  body: WebhookPaypalDto;
}

const N8N_NOTIFY_TIMEOUT_MS = 3_000;

@Injectable()
export class DonationsService {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Inject(DONATIONS_REPOSITORY) private readonly repository: DonationsRepository,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<{ orderId: string; approvalUrl?: string }> {
    // Create the pending row FIRST so we can embed its id as the PayPal custom_id.
    // This lets a capture/webhook resolve the donation even when it arrives by
    // PayPal order id alone.
    const donationId = randomUUID();
    const amountUsd = TIER_AMOUNTS[dto.tier];

    const order = await this.gateway.createOrder(dto.tier, { customId: donationId });

    await this.repository.create({
      id: donationId,
      tier: dto.tier,
      amountUsd,
      currency: 'USD',
      status: 'pending',
      gateway: this.gateway.name,
      gatewayRef: null,
      gatewayOrderId: order.gatewayOrderId ?? order.orderId,
      donorName: null,
      message: null,
    });

    return { orderId: order.orderId, approvalUrl: order.approvalUrl };
  }

  async capture(dto: CaptureDto): Promise<{ status: 'COMPLETED'; donationId: string }> {
    const result = await this.gateway.capture(dto.orderId);

    // Try custom_id first (PayPal may echo it), then fall back to gateway order id lookup.
    let donation: Donation | null = null;
    if (result.donationId) {
      donation = await this.repository.findById(result.donationId);
    }
    if (!donation) {
      donation = await this.repository.findByGatewayOrderId(dto.orderId);
    }
    if (!donation) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.repository.markPaid(donation.id, result.gatewayRef, {
      donorName: dto.donorName ?? null,
      message: dto.message ?? null,
    });

    void this.notifyN8n(updated);

    return { status: result.status, donationId: updated.id };
  }

  async handleWebhook(input: WebhookInput): Promise<{ received: boolean; duplicate?: boolean }> {
    // Signature verification is PayPal-specific. The mock gateway does not
    // implement it (dev-only path), so verification only runs when present.
    if (this.gateway.verifyWebhookSignature) {
      const verified = await this.gateway.verifyWebhookSignature({
        headers: input.headers,
        rawBody: input.rawBody,
      });
      if (!verified) {
        throw new UnauthorizedException('Invalid PayPal webhook signature');
      }
    }

    const dto = input.body;
    if (dto.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      // Only capture-completed events are relevant.
      return { received: true, duplicate: false };
    }

    if (!dto.resource) {
      throw new BadRequestException('Webhook payload missing resource');
    }

    const gatewayRef = dto.resource.id;
    if (!gatewayRef) {
      throw new BadRequestException('Webhook payload missing resource.id');
    }

    // Idempotency: a capture reference must be processed only once.
    const existing = await this.repository.findByGatewayRef(gatewayRef);
    if (existing) {
      return { received: true, duplicate: true };
    }

    // Link to a pending order via custom_id when present.
    const customId = dto.resource.custom_id;
    const pending = customId ? await this.repository.findById(customId) : null;

    if (pending && pending.status === 'pending') {
      const updated = await this.repository.markPaid(pending.id, gatewayRef, {
        donorName: pending.donorName,
        message: pending.message,
      });
      void this.notifyN8n(updated);
      return { received: true };
    }

    if (pending && pending.status === 'approved') {
      // Admin already approved this collaboration: never downgrade it.
      return { received: true, duplicate: false };
    }

    if (pending && pending.status === 'paid') {
      return { received: true, duplicate: true };
    }

    // No matching order: record the capture as a paid PayPal donation. The
    // repository ignores duplicate gateway_refs (ON CONFLICT DO NOTHING).
    const amountValue = dto.resource.amount?.value;
    const donation = await this.repository.create({
      id: randomUUID(),
      tier: this.tierFromAmount(amountValue),
      amountUsd: Number(amountValue) || 0,
      currency: dto.resource.amount?.currency_code ?? 'USD',
      status: 'paid',
      gateway: 'paypal',
      gatewayRef,
      donorName: null,
      message: null,
    });
    void this.notifyN8n(donation);

    return { received: true };
  }

  async getPublic(
    query: PublicQueryDto,
  ): Promise<{ items: DonationView[]; page: number; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const { items, total } = await this.repository.findApprovedPaginated(page, limit);

    return {
      items: items.map((donation) => this.toPublicView(donation)),
      page,
      total,
    };
  }

  /**
   * Fire-and-forget notification to the n8n workflow (Telegram). Never blocks or
   * breaks the payment flow: any failure is logged and swallowed.
   */
  private async notifyN8n(donation: Donation): Promise<void> {
    if (!env.donationsN8nWebhookUrl) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), N8N_NOTIFY_TIMEOUT_MS);

    try {
      await fetch(env.donationsN8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId: donation.id,
          tier: donation.tier,
          amountUsd: donation.amountUsd,
          donorName: donation.donorName,
          message: donation.message,
          gateway: donation.gateway,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      console.error('donations n8n webhook error:', err);
    } finally {
      clearTimeout(timer);
    }
  }

  private tierFromAmount(amount: string | undefined): DonationTier {
    const value = Number(amount);
    if (value === TIER_AMOUNTS.churu) {
      return 'churu';
    }
    if (value === TIER_AMOUNTS.salmon) {
      return 'salmon';
    }
    return 'croqueta';
  }

  private toPublicView(donation: Donation): DonationView {
    return {
      id: donation.id,
      tier: donation.tier,
      amountUsd: donation.amountUsd,
      currency: donation.currency,
      donorName: donation.donorName,
      message: donation.message,
      createdAt: donation.createdAt,
    };
  }
}
