import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TIER_AMOUNTS } from './donations.types';
import type { DonationTier } from './donations.types';
import type {
  PaymentCaptureResult,
  PaymentGateway,
  PaymentOrder,
  WebhookSignatureInput,
} from './payment-gateway.interface';

export interface PayPalConfig {
  mode: 'sandbox' | 'live' | 'disabled';
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookId: string;
  returnUrl: string;
  cancelUrl: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * PayPalGateway — Sprint 2.
 *
 * Talks to the real PayPal REST API (sandbox by default). Credentials are never
 * hardcoded: they come from env (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
 * `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE`). If PAYPAL_MODE is not 'disabled' but the
 * credentials are missing, every call fails fast with a clear message.
 */
@Injectable()
export class PayPalGateway implements PaymentGateway {
  readonly name = 'paypal' as const;

  private readonly config: PayPalConfig;
  private token: CachedToken | null = null;

  constructor(config: PayPalConfig) {
    this.config = config;
  }

  async createOrder(tier: DonationTier, options?: { customId?: string }): Promise<PaymentOrder> {
    this.assertConfigured();

    const token = await this.getAccessToken();
    const amount = TIER_AMOUNTS[tier].toFixed(2);

    const response = await this.request('/v2/checkout/orders', {
      method: 'POST',
      token,
      body: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount },
            ...(options?.customId ? { custom_id: options.customId } : {}),
          },
        ],
        application_context: {
          return_url: this.config.returnUrl,
          cancel_url: this.config.cancelUrl,
        },
      },
    });

    const data = (await response.json()) as {
      id?: string;
      links?: Array<{ rel?: string; href?: string }>;
    };

    const orderId = data.id;
    if (!orderId) {
      throw new Error('PayPal createOrder did not return an order id');
    }

    const approvalUrl = data.links?.find((link) => link.rel === 'approve')?.href;

    return {
      orderId,
      tier,
      amountUsd: TIER_AMOUNTS[tier],
      currency: 'USD',
      status: 'pending',
      approvalUrl,
    };
  }

  async capture(orderId: string): Promise<PaymentCaptureResult> {
    this.assertConfigured();

    const token = await this.getAccessToken();
    const response = await this.request(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: 'POST',
        token,
        body: {},
      },
    );

    const data = (await response.json()) as {
      status?: string;
      id?: string;
      purchase_units?: Array<{
        custom_id?: string;
        payments?: { captures?: Array<{ id?: string; status?: string }> };
      }>;
    };

    if (data.status !== 'COMPLETED') {
      throw new BadRequestException(
        `PayPal capture not completed (status: ${data.status ?? 'unknown'})`,
      );
    }

    const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? data.id;
    if (!captureId) {
      throw new Error('PayPal capture did not return a capture id');
    }

    return {
      status: 'COMPLETED',
      gatewayRef: captureId,
      donationId: data.purchase_units?.[0]?.custom_id,
    };
  }

  async verifyWebhookSignature(input: WebhookSignatureInput): Promise<boolean> {
    this.assertConfigured();

    if (!this.config.webhookId) {
      throw new UnauthorizedException(
        'PayPal webhooks cannot be verified: PAYPAL_WEBHOOK_ID is not configured',
      );
    }

    const token = await this.getAccessToken();
    const response = await this.request('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      token,
      body: {
        auth_algo: single(input.headers['paypal-auth-algo']),
        cert_url: single(input.headers['paypal-cert-url']),
        transmission_id: single(input.headers['paypal-transmission-id']),
        transmission_sig: single(input.headers['paypal-transmission-sig']),
        transmission_time: single(input.headers['paypal-transmission-time']),
        webhook_id: this.config.webhookId,
        webhook_event: JSON.parse(input.rawBody),
      },
    });

    const data = (await response.json()) as { verification_status?: string };
    return data.verification_status === 'SUCCESS';
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) {
      return this.token.token;
    }

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString(
      'base64',
    );

    const response = await this.request('/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      rawBody: true,
    });

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      throw new Error('PayPal token endpoint did not return an access token');
    }

    // Refresh 60s before expiry to avoid edge-case expiry mid-flight.
    const expiresAt = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;
    this.token = { token: data.access_token, expiresAt };
    return data.access_token;
  }

  private async request(
    path: string,
    options: {
      method: string;
      token?: string;
      headers?: Record<string, string>;
      body?: unknown;
      rawBody?: boolean;
    },
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    if (!options.rawBody && options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method: options.method,
        headers,
        body: options.rawBody
          ? (options.body as string)
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`PayPal API error ${response.status}: ${text}`);
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  private assertConfigured(): void {
    if (this.config.mode === 'disabled') {
      return;
    }
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error(
        'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET ' +
          '(or set PAYPAL_MODE=disabled to use the mock gateway).',
      );
    }
  }
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
