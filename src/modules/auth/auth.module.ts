import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthSessionService } from './auth-session.service';

@Module({
  controllers: [AuthController],
  providers: [AuthSessionService],
  exports: [AuthSessionService],
})
export class AuthModule {}
