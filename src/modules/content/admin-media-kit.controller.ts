import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { MediaKitService } from './media-kit.service';
import { UpdateMediaKitConfigDto } from './dto/update-media-kit-config.dto';

@Controller('admin/media-kit')
@UseGuards(AdminGuard)
export class AdminMediaKitController {
  constructor(private readonly mediaKitService: MediaKitService) {}

  @Get()
  async getConfig() {
    return this.mediaKitService.getAdminConfig();
  }

  @Put()
  async updateConfig(@Body() dto: UpdateMediaKitConfigDto) {
    return this.mediaKitService.updateAdminConfig(dto.key, dto.data);
  }
}
