import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthSessionService } from './auth-session.service';
import { CsrfService } from '../../shared/csrf/csrf.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authSessions: AuthSessionService,
    private readonly csrf: CsrfService,
  ) {}

  @Get('me')
  async me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.authSessions.getCurrentUser(req, res);
    return { user };
  }

  @Get('csrf')
  getCsrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let token = this.csrf.getCsrfTokenFromCookie(req);
    if (!token) {
      token = this.csrf.generateToken();
      this.csrf.setCsrfCookie(res, token);
    }
    return { token };
  }

  @Get('google')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async google(
    @Req() req: Request,
    @Res() res: Response,
    @Query('next') next?: string,
    @Query('origin') origin?: string,
  ) {
    const authUrl = await this.authSessions.getGoogleAuthUrl(req, res, next, origin);
    return res.redirect(authUrl);
  }

  @Get('callback')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('next') next?: string,
    @Query('origin') origin?: string,
  ) {
    const redirectTarget = this.authSessions.resolveRedirectTarget(origin, next);

    if (!code) {
      return res.redirect(
        `${redirectTarget.startsWith('http') ? new URL('/auth/login', redirectTarget).toString() : '/auth/login'}?error=oauth`,
      );
    }

    try {
      await this.authSessions.finishOAuth(req, res, code);
      return res.redirect(redirectTarget);
    } catch {
      const loginUrl = new URL('/auth/login', redirectTarget);
      loginUrl.searchParams.set('redirect', next && next.startsWith('/') ? next : '/blog');
      loginUrl.searchParams.set('error', 'oauth');
      return res.redirect(loginUrl.toString());
    }
  }

  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authSessions.clearSession(res);
    return { ok: true };
  }
}
