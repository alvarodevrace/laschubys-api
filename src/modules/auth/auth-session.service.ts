import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, Session, User } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
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

@Injectable()
export class AuthSessionService {
  private readonly accessCookieName = 'lc_access_token';
  private readonly refreshCookieName = 'lc_refresh_token';
  private readonly stateCookieName = 'lc_oauth_state';
  private readonly stateCookieMaxAge = 1000 * 60 * 10; // 10 minutes

  constructor(private readonly supabase: SupabaseService) {}

  async getCurrentUser(req: Request, res?: Response) {
    const session = await this.resolveSession(req, res);
    return session?.user ? this.toAuthUserView(session.user) : null;
  }

  async requireUser(req: Request, res?: Response) {
    const session = await this.resolveSession(req, res);

    if (!session?.user) {
      throw new UnauthorizedException('Se requiere autenticación');
    }

    return session.user;
  }

  async getGoogleAuthUrl(
    req: Request,
    res: Response,
    next: string | undefined,
    origin: string | undefined,
  ) {
    const frontendOrigin = this.normalizeOrigin(origin);
    const callbackUrl = new URL('/api/auth/callback', frontendOrigin);
    callbackUrl.searchParams.set('next', this.normalizeNextPath(next));
    callbackUrl.searchParams.set('origin', frontendOrigin);

    const state = this.generateState();
    this.writeStateCookie(res, state);

    const client = this.createBrowserAuthClient(req, res);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          state,
        },
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      throw new UnauthorizedException(error?.message || 'No se pudo iniciar el acceso con Google');
    }

    return data.url;
  }

  async finishOAuth(req: Request, res: Response, code: string) {
    const stateFromUrl = Array.isArray(req.query.state) ? req.query.state[0] : req.query.state;
    const stateFromCookie = this.parseCookies(req.headers.cookie)[this.stateCookieName];

    if (!stateFromUrl || !stateFromCookie || stateFromUrl !== stateFromCookie) {
      this.clearStateCookie(res);
      throw new UnauthorizedException('Estado OAuth inválido o ausente');
    }

    this.clearStateCookie(res);

    const client = this.createBrowserAuthClient(req, res);
    const { data, error } = await client.auth.exchangeCodeForSession(code);

    if (error || !data.session || !data.user) {
      this.clearSessionCookies(res);
      throw new UnauthorizedException(error?.message || 'No se pudo completar el acceso');
    }

    this.writeSessionCookies(res, data.session);
    return this.toAuthUserView(data.user);
  }

  clearSession(res: Response) {
    this.clearSessionCookies(res);
  }

  resolveRedirectTarget(origin: string | undefined, next: string | undefined) {
    return `${this.normalizeOrigin(origin)}${this.normalizeNextPath(next)}`;
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
      name:
        user.user_metadata?.['full_name'] ||
        user.user_metadata?.['name'] ||
        user.email ||
        'Cat Mom',
      avatar: user.user_metadata?.['avatar_url'] || null,
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

  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  private writeStateCookie(res: Response, state: string): void {
    res.cookie(this.stateCookieName, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: '/',
      maxAge: this.stateCookieMaxAge,
    });
  }

  private clearStateCookie(res: Response): void {
    res.clearCookie(this.stateCookieName, {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: env.isProduction,
      path: '/',
    });
  }

  private normalizeOrigin(value: string | undefined) {
    const normalized = value?.trim().replace(/\/+$/, '');

    if (normalized && env.allowedOrigins.includes(normalized)) {
      return normalized;
    }

    return env.allowedOrigins[0]!;
  }

  private normalizeNextPath(value: string | undefined) {
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return '/blog';
    }

    return value;
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
