import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as ws from 'ws';
import { env } from '../../shared/config/env';

@Injectable()
export class SupabaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly admin = createClient<any, 'laschubys'>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'laschubys' },
    realtime: { transport: ws as any },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly anon = createClient<any, 'laschubys'>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'laschubys' },
    realtime: { transport: ws as any },
  });
}
