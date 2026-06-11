import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env';

const CSRF_COOKIE_NAME = 'csrf-token';

@Injectable()
export class CsrfService {
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  setCsrfCookie(res: Response, token: string): void {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: env.isProduction,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24, // 24h
    });
  }

  getCsrfTokenFromCookie(req: Request): string | undefined {
    const raw = req.headers.cookie ?? '';
    const match = raw.split(';').find((c) => c.trim().startsWith(`${CSRF_COOKIE_NAME}=`));
    return match ? decodeURIComponent(match.split('=')[1]!) : undefined;
  }

  getCsrfTokenFromHeader(req: Request): string | undefined {
    const header = req.headers['x-csrf-token'];
    return Array.isArray(header) ? header[0] : header;
  }

  validate(req: Request): boolean {
    const cookieToken = this.getCsrfTokenFromCookie(req);
    const headerToken = this.getCsrfTokenFromHeader(req);
    return !!cookieToken && !!headerToken && cookieToken === headerToken;
  }
}
