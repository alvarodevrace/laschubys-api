import { SupabaseDonationsRepository } from './supabase-donations.repository';
import type { SupabaseService } from '../supabase/supabase.service';
import type { CreateDonationInput } from './donations-repository.interface';

function createSupabaseMock(terminalResult: Record<string, unknown>) {
  // Minimal chainable query builder: every chain method returns the builder,
  // terminal methods resolve to the configured result.
  const builder: {
    [key: string]: unknown;
    single: jest.Mock;
    maybeSingle: jest.Mock;
  } = {
    single: jest.fn(async () => terminalResult),
    maybeSingle: jest.fn(async () => terminalResult),
  };
  const chain = (m: string) => {
    builder[m] = jest.fn(() => builder);
  };
  ['upsert', 'insert', 'select', 'eq', 'order', 'range', 'onConflict', 'ignore', 'update'].forEach(
    chain,
  );
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(terminalResult).then(resolve);

  const admin = { from: jest.fn(() => builder) };
  const supabase = { admin } as unknown as SupabaseService;
  return { supabase, builder, admin };
}

const ROW = {
  id: 'donation-1',
  tier: 'churu',
  amount_usd: 10,
  currency: 'USD',
  donor_name: 'María',
  message: 'hola',
  status: 'approved',
  gateway: 'paypal',
  gateway_ref: 'CAP-123',
  gateway_order_id: null,
  created_at: '2026-09-07T00:00:00.000Z',
};

describe('SupabaseDonationsRepository', () => {
  it('create maps the domain input to snake_case and returns a Donation', async () => {
    const { supabase, builder } = createSupabaseMock({ data: ROW, error: null });
    const repo = new SupabaseDonationsRepository(supabase);

    const input: CreateDonationInput = {
      id: 'donation-1',
      tier: 'churu',
      amountUsd: 10,
      currency: 'USD',
      status: 'pending',
      gateway: 'paypal',
      gatewayRef: null,
      donorName: null,
      message: null,
    };

    const donation = await repo.create(input);
    expect(donation).toMatchObject({
      id: 'donation-1',
      tier: 'churu',
      amountUsd: 10,
      donorName: 'María',
      createdAt: '2026-09-07T00:00:00.000Z',
    });

    // Uses ON CONFLICT (gateway_ref) DO NOTHING for idempotency.
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount_usd: 10, donor_name: null }),
      { onConflict: 'gateway_ref', ignoreDuplicates: true },
    );
  });

  it('create recovers the existing row when a duplicate gateway_ref is ignored', async () => {
    const { supabase, builder } = createSupabaseMock({ data: null, error: null });
    const repo = new SupabaseDonationsRepository(supabase);

    // Simulate findByGatewayRef returning the existing row.
    builder.maybeSingle.mockResolvedValue({ data: ROW, error: null });

    const donation = await repo.create({
      id: 'donation-x',
      tier: 'croqueta',
      amountUsd: 5,
      currency: 'USD',
      status: 'paid',
      gateway: 'paypal',
      gatewayRef: 'CAP-123',
      donorName: null,
      message: null,
    });

    expect(donation.id).toBe('donation-1');
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it('findApprovedPaginated explicitly filters status=approved', async () => {
    const { supabase, builder } = createSupabaseMock({
      data: [ROW],
      error: null,
      count: 1,
    });
    const repo = new SupabaseDonationsRepository(supabase);

    const { items, total } = await repo.findApprovedPaginated(1, 20);
    expect(items).toHaveLength(1);
    expect(total).toBe(1);

    expect(builder.eq).toHaveBeenCalledWith('status', 'approved');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('markPaid updates status, gateway_ref, donor and message', async () => {
    const { supabase, builder } = createSupabaseMock({ data: ROW, error: null });
    const repo = new SupabaseDonationsRepository(supabase);

    await repo.markPaid('donation-1', 'CAP-999', { donorName: 'Juan', message: 'otro' });

    expect(builder.update).toHaveBeenCalledWith({
      status: 'paid',
      gateway_ref: 'CAP-999',
      donor_name: 'Juan',
      message: 'otro',
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'donation-1');
  });

  it('updateStatus updates only the status column', async () => {
    const { supabase, builder } = createSupabaseMock({ data: ROW, error: null });
    const repo = new SupabaseDonationsRepository(supabase);

    await repo.updateStatus('donation-1', 'approved');

    expect(builder.update).toHaveBeenCalledWith({ status: 'approved' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'donation-1');
  });
});
