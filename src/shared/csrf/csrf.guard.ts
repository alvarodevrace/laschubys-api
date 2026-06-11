import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CsrfService } from './csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrf: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const method = req.method?.toUpperCase();

    // Safe methods do not require CSRF validation
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    if (!this.csrf.validate(req)) {
      throw new ForbiddenException('Token CSRF inválido o ausente');
    }

    return true;
  }
}
