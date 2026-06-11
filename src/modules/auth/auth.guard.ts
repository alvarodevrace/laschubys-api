import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authSessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const user = await this.authSessions.getCurrentUser(req, res);
    if (!user) throw new UnauthorizedException('Se requiere autenticación');
    req['user'] = user;
    return true;
  }
}
