import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { Json } from '../../shared/types/supabase';

@Injectable()
export class CheckoutService {
  constructor(private readonly supabase: SupabaseService) {}

  async createOrder(dto: CreateOrderDto) {
    const { data, error } = await this.supabase.admin
      .from('orders')
      .insert({
        name: dto.customer.name,
        phone: dto.customer.phone,
        email: dto.customer.email,
        province: dto.customer.province,
        address: dto.customer.address,
        notes: dto.notes || null,
        items: JSON.parse(JSON.stringify(dto.items)) as Json,
        total: dto.total,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Order insert error:', error);
      throw new Error('No se pudo crear el pedido');
    }

    return { ok: true, orderId: data.id };
  }
}
