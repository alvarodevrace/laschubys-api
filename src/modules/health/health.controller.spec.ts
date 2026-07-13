import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { SupabaseService } from '../supabase/supabase.service';

describe('HealthController', () => {
  let controller: HealthController;
  const mockSupabase = { admin: { from: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: SupabaseService, useValue: mockSupabase }],
    }).compile();
    controller = module.get(HealthController);
  });

  describe('check (liveness)', () => {
    it('returns ok with timestamp and uptime', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('ready (readiness)', () => {
    it('returns ok when supabase query succeeds', async () => {
      mockSupabase.admin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue({ error: null }) }),
      });
      expect(await controller.ready()).toEqual({ status: 'ok' });
    });

    it('returns degraded when supabase query fails', async () => {
      mockSupabase.admin.from.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ limit: jest.fn().mockResolvedValue({ error: { message: 'fail' } }) }),
      });
      expect(await controller.ready()).toEqual({ status: 'degraded', detail: 'fail' });
    });
  });
});
