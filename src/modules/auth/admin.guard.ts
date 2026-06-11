import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authSessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const user = await this.authSessions.getCurrentUser(req, res);
    if (!user) throw new UnauthorizedException('Se requiere autenticación');
    if (user.role !== 'admin') throw new ForbiddenException('Se requiere rol de administrador');
    req['user'] = user;
    return true;
  }
}
