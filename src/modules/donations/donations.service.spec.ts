import { UnauthorizedException } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { InMemoryDonationsRepository } from './in-memory-donations.repository';
import type { Donation } from './donations.types';
import type { PaymentGateway, PaymentOrder } from './payment-gateway.interface';

describe('DonationsService', () => {
  let service: DonationsService;
  let repo: InMemoryDonationsRepository;
  let gateway: jest.Mocked<PaymentGateway>;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    repo = new InMemoryDonationsRepository();
    gateway = {
      name: 'mock',
      createOrder: jest.fn(),
      capture: jest.fn(),
    } as unknown as jest.Mocked<PaymentGateway>;
    service = new DonationsService(gateway, repo);

    fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function seedPending(
    id: string,
    status: Donation['status'] = 'pending',
  ): Promise<Donation> {
    const donation: Donation = {
      id,
      tier: 'churu',
      amountUsd: 10,
      currency: 'USD',
      donorName: null,
      message: null,
      status,
      gateway: 'mock',
      gatewayRef: null,
      gatewayOrderId: null,
      createdAt: new Date().toISOString(),
    };
    return repo.create(donation);
  }

  describe('createOrder', () => {
    it('creates a pending row first and embeds its id as the gateway custom_id', async () => {
      const order: PaymentOrder = {
        orderId: 'ORDER-1',
        tier: 'churu',
        amountUsd: 10,
        currency: 'USD',
        status: 'pending',
        approvalUrl: 'https://sandbox.paypal.com/approve/ORDER-1',
      };
      gateway.createOrder.mockResolvedValue(order);

      const result = await service.createOrder({ tier: 'churu' });

      expect(result).toEqual({ orderId: 'ORDER-1', approvalUrl: order.approvalUrl });

      const [tier, options] = gateway.createOrder.mock.calls[0];
      expect(tier).toBe('churu');
      const customId = options!.customId!;
      expect(customId).toBeDefined();

      const pending = await repo.findById(customId);
      expect(pending).toMatchObject({ status: 'pending', gateway: 'mock', tier: 'churu' });
    });
  });

  describe('capture', () => {
    it('marks the resolved donation paid and notifies n8n', async () => {
      await seedPending('donation-1');
      gateway.capture.mockResolvedValue({
        status: 'COMPLETED',
        gatewayRef: 'CAP-1',
        donationId: 'donation-1',
      });

      const result = await service.capture({
        orderId: 'ORDER-1',
        donorName: 'Ana',
        message: 'hola',
      });

      expect(result).toEqual({ status: 'COMPLETED', donationId: 'donation-1' });

      const updated = await repo.findById('donation-1');
      expect(updated).toMatchObject({ status: 'paid', gatewayRef: 'CAP-1', donorName: 'Ana' });

      // n8n fire-and-forget fired.
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('marks the linked pending order paid (custom_id)', async () => {
      await seedPending('donation-1');

      const result = await service.handleWebhook({
        headers: {},
        rawBody: '{}',
        body: {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'CAP-1',
            custom_id: 'donation-1',
            amount: { value: '10', currency_code: 'USD' },
          },
        },
      });

      expect(result).toEqual({ received: true });

      const updated = await repo.findById('donation-1');
      expect(updated).toMatchObject({ status: 'paid', gatewayRef: 'CAP-1' });
    });

    it('is idempotent: a duplicate gateway_ref returns duplicate and does not re-mark', async () => {
      // A donation already carrying this gateway ref.
      await seedPending('donation-1');
      await repo.markPaid('donation-1', 'CAP-1', { donorName: null, message: null });

      const result = await service.handleWebhook({
        headers: {},
        rawBody: '{}',
        body: {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: { id: 'CAP-1', custom_id: 'donation-1' },
        },
      });

      expect(result).toEqual({ received: true, duplicate: true });
    });

    it('does not downgrade a donation that was already approved by admin', async () => {
      await seedPending('donation-1', 'approved');

      const result = await service.handleWebhook({
        headers: {},
        rawBody: '{}',
        body: {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: { id: 'CAP-1', custom_id: 'donation-1' },
        },
      });

      expect(result).toEqual({ received: true, duplicate: false });
      const updated = await repo.findById('donation-1');
      expect(updated!.status).toBe('approved');
    });

    it('ignores non-capture-completed events', async () => {
      const result = await service.handleWebhook({
        headers: {},
        rawBody: '{}',
        body: { event_type: 'PAYMENT.CAPTURE.DENIED', resource: { id: 'CAP-1' } },
      });

      expect(result).toEqual({ received: true, duplicate: false });
    });

    it('rejects with 401 when the PayPal signature does not verify', async () => {
      const paypalGateway = {
        name: 'paypal',
        createOrder: jest.fn(),
        capture: jest.fn(),
        verifyWebhookSignature: jest.fn().mockResolvedValue(false),
      } as unknown as PaymentGateway;
      service = new DonationsService(paypalGateway, repo);

      await expect(
        service.handleWebhook({
          headers: { 'paypal-transmission-id': 't1' },
          rawBody: '{}',
          body: { event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAP-1' } },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getPublic', () => {
    it('returns only approved donations, paginated', async () => {
      const result = await service.getPublic({ page: '1', limit: '2' });
      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThan(0);
      expect(result.items.every((item) => 'donorName' in item)).toBe(true);
    });
  });
});
