import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthSessionService } from './auth-session.service';
import { CsrfService } from '../../shared/csrf/csrf.service';
import { LoginDto } from './dto/login.dto';

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

  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    const user = await this.authSessions.loginWithPassword(req, res, dto.email, dto.password);
    return { user };
  }

  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authSessions.clearSession(res);
    return { ok: true };
  }
}
