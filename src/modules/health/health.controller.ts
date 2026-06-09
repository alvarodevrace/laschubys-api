import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async check() {
    const { error } = await this.supabase.admin.from('profiles').select('id').limit(1);
    if (error) return { status: 'degraded', detail: error.message };
    return { status: 'ok' };
  }

  @Get('debug-sentry')
  debugSentry() {
    throw new Error('Sentry test error — laschubys-api');
  }
}
