import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import * as ws from 'ws';
import { env } from '../../shared/config/env';
import type { Database } from '../../shared/types/supabase';

@Injectable()
export class SupabaseService {
  readonly admin = createClient<Database, 'laschubys'>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'laschubys' },
      realtime: { transport: ws as unknown as WebSocketLikeConstructor },
    },
  );

  readonly anon = createClient<Database, 'laschubys'>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'laschubys' },
    realtime: { transport: ws as unknown as WebSocketLikeConstructor },
  });
}
