import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { env } from '../../shared/config/env';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateContactDto) {
    const { data, error } = await this.supabase.admin
      .from('contacts')
      .insert({
        name: dto.name,
        email: dto.email,
        message: dto.message,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Contact insert error:', error);
      throw new Error('No se pudo guardar el mensaje');
    }

    // Notificación n8n (opcional)
    if (env.n8nWebhookUrl) {
      void this.notifyN8n(dto);
    }

    return { ok: true, contactId: data.id };
  }

  private async notifyN8n(dto: CreateContactDto) {
    try {
      await fetch(env.n8nWebhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'laschubys-contact',
          name: dto.name,
          email: dto.email,
          message: dto.message,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('n8n webhook error:', err);
    }
  }
}
