import { Module } from '@nestjs/common';
import { CsrfModule } from '../../shared/csrf/csrf.module';
import { AuthController } from './auth.controller';
import { AuthSessionService } from './auth-session.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [CsrfModule],
  controllers: [AuthController],
  providers: [AuthSessionService, AuthGuard, AdminGuard],
  exports: [AuthSessionService, AuthGuard, AdminGuard],
})
export class AuthModule {}
