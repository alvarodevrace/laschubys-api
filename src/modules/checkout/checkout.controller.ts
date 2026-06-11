import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CsrfGuard } from '../../shared/csrf/csrf.guard';

@Controller('checkout')
@UseGuards(CsrfGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.checkoutService.createOrder(dto);
  }
}
