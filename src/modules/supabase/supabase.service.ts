import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import * as ws from 'ws';
import { env } from '../../shared/config/env';

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type Database = {
  laschubys: {
    Tables: {
      blog_posts: GenericTable;
      products: GenericTable;
      comments: GenericTable;
      profiles: GenericTable;
      orders: GenericTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

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
