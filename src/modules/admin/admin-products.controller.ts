import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const { data, error } = await this.supabase.admin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { data, error } = await this.supabase.admin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Producto no encontrado');
    return data;
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const id = dto.id?.trim() || randomUUID();
    const slug = await this.ensureUniqueSlug(dto.slug?.trim() || this.slugify(dto.name));
    const payload = this.toProductInsert({ ...dto, id, slug });

    const { data, error } = await this.supabase.admin
      .from('products')
      .insert(payload as any)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const slug = dto.slug?.trim() ? await this.ensureUniqueSlug(dto.slug.trim(), id) : undefined;
    const payload = this.toProductInsert({ ...dto, slug });

    const { data, error } = await this.supabase.admin
      .from('products')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Producto no encontrado');
    return data;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const { error } = await this.supabase.admin.from('products').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug || 'producto';
    let suffix = 2;
    const originalSlug = slug;

    while (await this.slugExists(slug, excludeId)) {
      slug = `${originalSlug}-${suffix}`;
      suffix += 1;
      if (suffix > 1000) throw new BadRequestException('No se pudo generar un slug único');
    }

    return slug;
  }

  private async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase.admin.from('products').select('id').eq('slug', slug).limit(1);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).length > 0;
  }

  private toProductInsert(
    dto: Partial<CreateProductDto> & { id?: string; slug?: string },
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (dto.id !== undefined) payload.id = dto.id;
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.price !== undefined) payload.price = dto.price;
    if (dto.source !== undefined) payload.source = dto.source;
    if (dto.tag !== undefined) payload.tag = dto.tag;
    if (dto.copy !== undefined) payload.copy = dto.copy;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.details !== undefined) payload.details = dto.details;
    if (dto.specifications !== undefined) payload.specifications = dto.specifications;
    if (dto.images !== undefined) payload.images = dto.images;
    if (dto.affiliate_url !== undefined) payload.affiliate_url = dto.affiliate_url;
    if (dto.shipping_note !== undefined) payload.shipping_note = dto.shipping_note;
    if (dto.active !== undefined) payload.active = dto.active;
    if (dto.categoryId !== undefined) payload.category_id = dto.categoryId;
    if (dto.productType !== undefined) payload.product_type = dto.productType;
    if (dto.slug !== undefined) payload.slug = dto.slug;

    return payload;
  }
}
