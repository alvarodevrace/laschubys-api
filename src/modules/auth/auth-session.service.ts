import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, Session, User } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { createHmac, randomBytes, createHash } from 'node:crypto';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import * as ws from 'ws';
import { env } from '../../shared/config/env';
import { SupabaseService } from '../supabase/supabase.service';

export type AuthUserView = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'admin' | 'user';
};

type AdminJwtPayload = {
  sub: string;
  email: string;
  role: 'admin';
  exp: number;
};

@Injectable()
export class AuthSessionService {
  private readonly accessCookieName = 'lc_access_token';
  private readonly refreshCookieName = 'lc_refresh_token';
  private readonly adminCookieName = 'lc_admin_token';
  private readonly adminTokenMaxAge = 1000 * 60 * 60 * 24 * 30; // 30 days

  constructor(private readonly supabase: SupabaseService) {}

  async getCurrentUser(req: Request, res?: Response) {
    const adminUser = this.resolveAdminUser(req);
    if (adminUser) {
      return adminUser;
    }

    const session = await this.resolveSession(req, res);
    return session?.user ? this.toAuthUserView(session.user) : null;
  }

  async requireUser(req: Request, res?: Response) {
    const user = await this.getCurrentUser(req, res);

    if (!user) {
      throw new UnauthorizedException('Se requiere autenticación');
    }

    return user;
  }

  async loginWithPassword(_req: Request, res: Response, email: string, password: string) {
    let normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      normalizedEmail = `${normalizedEmail}@laschubys.com`;
    }

    const passwordHash = createHash('sha256').update(password).digest('hex');

    if (normalizedEmail !== env.adminEmail.toLowerCase() || passwordHash !== env.adminPasswordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.signAdminToken();
    this.writeAdminCookie(res, token);

    return this.toAdminUserView();
  }

  clearSession(res: Response) {
    this.clearSessionCookies(res);
    this.clearAdminCookie(res);
  }

  private resolveAdminUser(req: Request): AuthUserView | null {
    const token = this.parseCookies(req.headers.cookie)[this.adminCookieName];
    if (!token) {
      return null;
    }

    const payload = this.verifyAdminToken(token);
    if (!payload) {
      return null;
    }

    return this.toAdminUserView();
  }

  private signAdminToken(): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload: AdminJwtPayload = {
      sub: env.adminUserId,
      email: env.adminEmail,
      role: 'admin',
      exp: nowSeconds + 60 * 60 * 24 * 30,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = createHmac('sha256', env.adminAuthSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyAdminToken(token: string): AdminJwtPayload | null {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      if (!encodedHeader || !encodedPayload || !signature) {
        return null;
      }

      const expectedSignature = createHmac('sha256', env.adminAuthSecret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as AdminJwtPayload;

      if (payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  private toAdminUserView(): AuthUserView {
    return {
      id: env.adminUserId,
      email: env.adminEmail,
      name: 'Admin Las Chubys',
      avatar: null,
      role: 'admin',
    };
  }

  private async resolveSession(req: Request, res?: Response) {
    const cookies = this.parseCookies(req.headers.cookie);
    const accessToken = cookies[this.accessCookieName];
    const refreshToken = cookies[this.refreshCookieName];

    if (!accessToken && !refreshToken) {
      return null;
    }

    const client = this.createBrowserAuthClient(req, res);
    const response =
      accessToken && refreshToken
        ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : refreshToken
          ? await client.auth.refreshSession({ refresh_token: refreshToken })
          : { data: { session: null, user: null }, error: new Error('Sesión incompleta') };

    if (response.error || !response.data.session || !response.data.user) {
      if (res) {
        this.clearSessionCookies(res);
      }
      return null;
    }

    if (res) {
      this.writeSessionCookies(res, response.data.session);
    }

    return response.data.session;
  }

  private async toAuthUserView(user: User): Promise<AuthUserView> {
    const { data: profile } = await this.supabase.admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.['name'] || user.email || 'Admin',
      avatar: null,
      role: this.validateRole(profile?.role),
    };
  }

  private createBrowserAuthClient(req: Request, res?: Response) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: env.isProduction,
      path: '/',
    };

    return createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
        storage: {
          getItem: async (key: string) => this.parseCookies(req.headers.cookie)[key] ?? null,
          setItem: async (key: string, value: string) => {
            if (res) {
              res.cookie(key, value, cookieOptions);
            }
          },
          removeItem: async (key: string) => {
            if (res) {
              res.clearCookie(key, cookieOptions);
            }
          },
        },
      },
      realtime: { transport: ws as unknown as WebSocketLikeConstructor },
      global: {
        headers: { 'X-Client-Info': 'laschubys-api/auth-session' },
      },
    });
  }

  private writeSessionCookies(res: Response, session: Session) {
    res.cookie(this.accessCookieName, session.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: '/',
      maxAge: Math.max(session.expires_in, 60) * 1000,
    });
    res.cookie(this.refreshCookieName, session.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  private clearSessionCookies(res: Response) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: env.isProduction,
      path: '/',
    };

    res.clearCookie(this.accessCookieName, cookieOptions);
    res.clearCookie(this.refreshCookieName, cookieOptions);
  }

  private writeAdminCookie(res: Response, token: string) {
    res.cookie(this.adminCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: '/',
      maxAge: this.adminTokenMaxAge,
    });
  }

  private clearAdminCookie(res: Response) {
    res.clearCookie(this.adminCookieName, {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: env.isProduction,
      path: '/',
    });
  }

  private validateRole(role: string | null | undefined): 'admin' | 'user' {
    return role === 'admin' ? 'admin' : 'user';
  }

  private parseCookies(raw = '') {
    return raw
      .split(';')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, entry) => {
        const separator = entry.indexOf('=');
        if (separator === -1) {
          return acc;
        }

        const key = entry.slice(0, separator);
        const value = entry.slice(separator + 1);
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
  }
}
