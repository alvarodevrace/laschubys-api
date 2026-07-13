import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Liveness probe: confirma que el proceso responde.
   * Debe ser ligero y no depender de servicios externos.
   */
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Readiness probe: verifica dependencias críticas (Supabase).
   */
  @Get('ready')
  async ready() {
    const { error } = await this.supabase.admin.from('profiles').select('id').limit(1);
    if (error) return { status: 'degraded', detail: error.message };
    return { status: 'ok' };
  }

  @Get('debug-sentry')
  debugSentry() {
    throw new Error('Sentry test error — laschubys-api');
  }
}
