import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CsrfGuard } from '../../shared/csrf/csrf.guard';
import { DonationsService } from './donations.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CaptureDto } from './dto/capture.dto';
import { WebhookPaypalDto } from './dto/webhook-paypal.dto';
import { PublicQueryDto } from './dto/public-query.dto';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('mock/create-order')
  @UseGuards(CsrfGuard)
  @Throttle({ donations: { limit: 10, ttl: 60000 } })
  mockCreateOrder(@Body() dto: CreateOrderDto) {
    return this.donationsService.createOrder(dto);
  }

  @Post('mock/capture')
  @UseGuards(CsrfGuard)
  @Throttle({ donations: { limit: 10, ttl: 60000 } })
  mockCapture(@Body() dto: CaptureDto) {
    return this.donationsService.capture(dto);
  }

  @Post('paypal/create-order')
  @UseGuards(CsrfGuard)
  @Throttle({ donations: { limit: 10, ttl: 60000 } })
  paypalCreateOrder(@Body() dto: CreateOrderDto) {
    return this.donationsService.createOrder(dto);
  }

  @Post('paypal/capture')
  @UseGuards(CsrfGuard)
  @Throttle({ donations: { limit: 10, ttl: 60000 } })
  paypalCapture(@Body() dto: CaptureDto) {
    return this.donationsService.capture(dto);
  }

  @Post('webhooks/paypal')
  @HttpCode(200)
  @Throttle({ donations: { limit: 20, ttl: 60000 } })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    // The raw body is already JSON-parsed by Express into req.body. The global
    // ValidationPipe is intentionally not used here: PayPal webhooks carry many
    // fields we don't declare, and authenticity is enforced by signature.
    const body = req.body as WebhookPaypalDto;
    return this.donationsService.handleWebhook({ headers, rawBody, body });
  }

  @Get('public')
  getPublic(@Query() query: PublicQueryDto) {
    return this.donationsService.getPublic(query);
  }
}
