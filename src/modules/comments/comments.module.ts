import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommentsController } from './comments.controller';

@Module({
  imports: [AuthModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
