import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CsrfGuard } from '../../shared/csrf/csrf.guard';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UseGuards(CsrfGuard)
  async create(@Body() dto: CreateOrderDto) {
    return this.checkoutService.createOrder(dto);
  }
}
