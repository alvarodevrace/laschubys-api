import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CsrfModule } from '../../shared/csrf/csrf.module';
import { CommentsController } from './comments.controller';

@Module({
  imports: [AuthModule, CsrfModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
