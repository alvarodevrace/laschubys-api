import { Module } from '@nestjs/common';
import { CsrfModule } from '../../shared/csrf/csrf.module';
import { env } from '../../shared/config/env';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { MockGateway } from './mock-gateway';
import { PayPalGateway } from './paypal-gateway';
import { InMemoryDonationsRepository } from './in-memory-donations.repository';
import { SupabaseDonationsRepository } from './supabase-donations.repository';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import type { PaymentGateway } from './payment-gateway.interface';
import { DONATIONS_REPOSITORY } from './donations-repository.interface';

/**
 * Gateway selection:
 * - PAYPAL_MODE=disabled -> in-memory MockGateway (local dev, no credentials).
 * - otherwise -> real PayPalGateway (sandbox by default). Fails fast with a
 *   clear error if PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are missing.
 */
function selectGateway(): PaymentGateway {
  if (env.paypalMode !== 'disabled') {
    return new PayPalGateway({
      mode: env.paypalMode,
      baseUrl: env.paypalBaseUrl,
      clientId: env.paypalClientId,
      clientSecret: env.paypalClientSecret,
      webhookId: env.paypalWebhookId,
      returnUrl: env.donationsReturnUrl,
      cancelUrl: env.donationsCancelUrl,
    });
  }
  return new MockGateway();
}

@Module({
  imports: [CsrfModule],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    { provide: PAYMENT_GATEWAY, useFactory: selectGateway },
    // Real repository by default. InMemoryDonationsRepository stays available
    // (as a class) for unit tests.
    { provide: DONATIONS_REPOSITORY, useClass: SupabaseDonationsRepository },
  ],
})
export class DonationsModule {}
