import { IsEnum } from 'class-validator';
import { DONATION_TIERS } from '../donations.types';
import type { DonationTier } from '../donations.types';

export class CreateOrderDto {
  @IsEnum(DONATION_TIERS)
  tier!: DonationTier;
}
