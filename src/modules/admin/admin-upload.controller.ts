import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SupabaseService } from '../supabase/supabase.service';

const BUCKET = 'las-chubys-media';
const MAX_SIZE_MB = 5;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

@Controller('admin/upload')
export class AdminUploadController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Tipo no permitido: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new PayloadTooLargeException(`Máximo ${MAX_SIZE_MB} MB`);
    }

    await this.ensureBucket();

    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const path = `${timestamp}-${random}.${ext}`;

    const { error } = await this.supabase.admin.storage.from(BUCKET).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) throw new BadRequestException(`Error subiendo imagen: ${error.message}`);

    const { data } = this.supabase.admin.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }

  private async ensureBucket() {
    const { data: buckets } = await this.supabase.admin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      await this.supabase.admin.storage.createBucket(BUCKET, { public: true });
    }
  }
}
