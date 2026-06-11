import { Controller, Post, Body } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.checkoutService.createOrder(dto);
  }
}
