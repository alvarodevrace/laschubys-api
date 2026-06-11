import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CsrfGuard } from '../../shared/csrf/csrf.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(CsrfGuard)
  @Throttle({ contact: { limit: 3, ttl: 3600000 } })
  async create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
