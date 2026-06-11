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
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        province: dto.province,
        address: dto.address,
        notes: dto.notes || null,
        items: JSON.parse(JSON.stringify(dto.items)) as Json,
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
