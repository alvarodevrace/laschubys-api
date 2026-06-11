import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUserView } from '../auth/auth-session.service';
import { SupabaseService } from '../supabase/supabase.service';

class AddCommentDto {
  @IsString() slug!: string;
  @IsString() @MinLength(2) @MaxLength(1000) body!: string;
}

@Controller('comments')
export class CommentsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  @UseGuards(AuthGuard)
  async add(@Body() dto: AddCommentDto, @Req() req: Request) {
    const user = (req as unknown as { user: AuthUserView }).user;
    const authorName = user.name || 'Anónimo';

    const { data: comment, error: insertError } = await this.supabase.admin
      .from('comments')
      .insert({
        post_slug: dto.slug,
        user_id: user.id,
        author_name: authorName,
        body: dto.body,
        reported: false,
      })
      .select('id, post_slug, user_id, author_name, body, created_at')
      .single();

    if (insertError) {
      console.error(insertError);
      throw new BadRequestException('No se pudo guardar el comentario');
    }

    return {
      ok: true,
      comment: {
        id: comment.id,
        author: comment.author_name,
        body: comment.body,
        date: this.formatCommentDate(comment.created_at as string),
      },
    };
  }

  private formatCommentDate(value: string) {
    return new Intl.DateTimeFormat('es-EC', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
