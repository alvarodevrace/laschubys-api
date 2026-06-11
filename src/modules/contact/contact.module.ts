import { Module } from '@nestjs/common';
import { CsrfModule } from '../../shared/csrf/csrf.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [CsrfModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
