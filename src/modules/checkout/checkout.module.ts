import { Module } from '@nestjs/common';
import { CsrfModule } from '../../shared/csrf/csrf.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [CsrfModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
