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
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Controller('admin/posts')
export class AdminPostsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const { data, error } = await this.supabase.admin
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { data, error } = await this.supabase.admin
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Post no encontrado');
    return data;
  }

  @Post()
  async create(@Body() dto: CreatePostDto) {
    const { data, error } = await this.supabase.admin
      .from('blog_posts')
      .insert(dto)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const { data, error } = await this.supabase.admin
      .from('blog_posts')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Post no encontrado');
    return data;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const { error } = await this.supabase.admin.from('blog_posts').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}
