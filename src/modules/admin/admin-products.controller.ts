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
    const id = dto.id?.trim() || this.slugify(dto.name);
    const { data, error } = await this.supabase.admin
      .from('products')
      .insert({ ...dto, id })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const { data, error } = await this.supabase.admin
      .from('products')
      .update(dto)
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
}
