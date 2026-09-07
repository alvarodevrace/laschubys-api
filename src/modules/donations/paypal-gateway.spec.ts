import { BadRequestException } from '@nestjs/common';
import { PayPalGateway } from './paypal-gateway';
import type { PayPalConfig } from './paypal-gateway';

const CONFIG: PayPalConfig = {
  mode: 'sandbox',
  baseUrl: 'https://api-m.sandbox.paypal.com',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  webhookId: 'wh-id',
  returnUrl: 'https://invitame.laschubys.com/gracias',
  cancelUrl: 'https://invitame.laschubys.com/',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PayPalGateway', () => {
  let gateway: PayPalGateway;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    gateway = new PayPalGateway(CONFIG);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('access token', () => {
    it('fetches a token once and caches it for subsequent calls', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/v2/oauth2/token')) {
          return jsonResponse(200, { access_token: 'abc', expires_in: 3600 });
        }
        if (url.includes('/v2/checkout/orders')) {
          return jsonResponse(201, { id: 'ORDER-1', status: 'CREATED', links: [] });
        }
        throw new Error(`Unexpected url ${url}`);
      });

      await gateway.createOrder('churu', { customId: 'donation-1' });
      await gateway.createOrder('croqueta', { customId: 'donation-2' });

      const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/v2/oauth2/token'),
      );
      expect(tokenCalls).toHaveLength(1);
    });
  });

  describe('createOrder', () => {
    it('returns the order id, tier, amount and approval url', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/v2/oauth2/token')) {
          return jsonResponse(200, { access_token: 'abc', expires_in: 3600 });
        }
        if (url.includes('/v2/checkout/orders')) {
          return jsonResponse(201, {
            id: 'ORDER-1',
            status: 'CREATED',
            links: [{ rel: 'approve', href: 'https://sandbox.paypal.com/approve/ORDER-1' }],
          });
        }
        throw new Error(`Unexpected url ${url}`);
      });

      const order = await gateway.createOrder('salmon', { customId: 'donation-1' });

      expect(order).toMatchObject({
        orderId: 'ORDER-1',
        tier: 'salmon',
        amountUsd: 15,
        currency: 'USD',
        status: 'pending',
        approvalUrl: 'https://sandbox.paypal.com/approve/ORDER-1',
      });

      // The custom_id must be embedded in the order request.
      const orderCall = fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/v2/checkout/orders'),
      );
      const body = JSON.parse(orderCall![1].body);
      expect(body.purchase_units[0].custom_id).toBe('donation-1');
      expect(body.purchase_units[0].amount.value).toBe('15.00');
      expect(body.intent).toBe('CAPTURE');
    });
  });

  describe('capture', () => {
    it('returns the capture id and donation id for a COMPLETED capture', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/v2/oauth2/token')) {
          return jsonResponse(200, { access_token: 'abc', expires_in: 3600 });
        }
        if (url.includes('/capture')) {
          return jsonResponse(200, {
            id: 'ORDER-1',
            status: 'COMPLETED',
            purchase_units: [
              {
                custom_id: 'donation-1',
                payments: { captures: [{ id: 'CAP-123', status: 'COMPLETED' }] },
              },
            ],
          });
        }
        throw new Error(`Unexpected url ${url}`);
      });

      const result = await gateway.capture('ORDER-1');
      expect(result).toEqual({ status: 'COMPLETED', gatewayRef: 'CAP-123', donationId: 'donation-1' });
    });

    it('throws BadRequestException when the capture is not COMPLETED', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/v2/oauth2/token')) {
          return jsonResponse(200, { access_token: 'abc', expires_in: 3600 });
        }
        if (url.includes('/capture')) {
          return jsonResponse(200, {
            id: 'ORDER-1',
            status: 'DECLINED',
            purchase_units: [{ custom_id: 'donation-1', payments: { captures: [] } }],
          });
        }
        throw new Error(`Unexpected url ${url}`);
      });

      await expect(gateway.capture('ORDER-1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('verifyWebhookSignature', () => {
    const signatureInput = {
      headers: {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://cert',
        'paypal-transmission-id': 't1',
        'paypal-transmission-sig': 'sig',
        'paypal-transmission-time': '2026-09-07T00:00:00Z',
      },
      rawBody: '{"event_type":"PAYMENT.CAPTURE.COMPLETED","resource":{"id":"CAP-1"}}',
    };

    it('returns true when verification_status is SUCCESS', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/v2/oauth2/token')) {
          return jsonResponse(200, { access_token: 'abc', expires_in: 3600 });
        }
        if (url.includes('/verify-webhook-signature')) {
          return jsonResponse(200, { verification_status: 'SUCCESS' });
        }
        throw new Error(`Unexpected url ${url}`);
      });

      await expect(gateway.verifyWebhookSignature(signatureInput)).resolves.toBe(true);
    });

    it('returns false when verification_status is FAILURE', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/v2/oauth2/token')) {
          return jsonResponse(200, { access_token: 'abc', expires_in: 3600 });
        }
        if (url.includes('/verify-webhook-signature')) {
          return jsonResponse(200, { verification_status: 'FAILURE' });
        }
        throw new Error(`Unexpected url ${url}`);
      });

      await expect(gateway.verifyWebhookSignature(signatureInput)).resolves.toBe(false);
    });
  });

  describe('configuration', () => {
    it('fails with a clear error when credentials are missing and mode is not disabled', async () => {
      const unconfigured = new PayPalGateway({ ...CONFIG, clientId: '', clientSecret: '' });
      await expect(unconfigured.createOrder('churu')).rejects.toThrow(
        /PAYPAL_CLIENT_ID/,
      );
    });

    it('throws when webhook id is missing', async () => {
      const noWebhook = new PayPalGateway({ ...CONFIG, webhookId: '' });
      const input = {
        headers: { 'paypal-transmission-id': 't1' },
        rawBody: '{}',
      };
      await expect(noWebhook.verifyWebhookSignature(input)).rejects.toThrow(
        /PAYPAL_WEBHOOK_ID/,
      );
    });
  });
});
