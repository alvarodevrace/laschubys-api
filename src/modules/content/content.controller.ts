import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { GetPostParamsDto } from './dto/get-post-params.dto';
import type { Database } from '../../shared/types/supabase';

const SITE_URL = 'https://laschubys.com';
const STATIC_ROUTES = ['', 'tienda', 'blog', 'about', 'servicios', 'contact'];

type BlogPostRow = Database['laschubys']['Tables']['blog_posts']['Row'];
type CommentRow = Database['laschubys']['Tables']['comments']['Row'];
type ProductRow = Database['laschubys']['Tables']['products']['Row'];

@Controller('content')
export class ContentController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('posts')
  async getPosts(@Query() query: GetPostsQueryDto) {
    const supabaseQuery = this.supabase.anon
      .from('blog_posts')
      .select(
        'id, slug, title, excerpt, content, category, read_time, cover_image, author, published_at, created_at',
      )
      .order('published_at', { ascending: false });

    const parsedLimit = Number(query.limit);
    const { data } =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? await supabaseQuery.limit(parsedLimit)
        : await supabaseQuery;

    return (data || []).map((row) => this.toBlogPostView(row as BlogPostRow));
  }

  @Get('posts/:slug')
  async getPost(@Param() params: GetPostParamsDto) {
    const { slug } = params;
    const [{ data: posts }, { data: comments }] = await Promise.all([
      this.supabase.anon
        .from('blog_posts')
        .select(
          'id, slug, title, excerpt, content, category, read_time, cover_image, author, published_at, created_at',
        )
        .eq('slug', slug)
        .limit(1),
      this.supabase.anon
        .from('comments')
        .select('id, author_name, body, created_at')
        .eq('post_slug', slug)
        .eq('reported', false)
        .order('created_at', { ascending: false }),
    ]);

    const post = (posts || [])[0] as BlogPostRow | undefined;
    if (!post) {
      return null;
    }

    return {
      ...this.toBlogPostView(post),
      comments: ((comments || []) as CommentRow[]).map((comment) => this.toCommentView(comment)),
    };
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getSitemap(@Res() res: Response) {
    const [{ data: posts }, { data: products }] = await Promise.all([
      this.supabase.anon
        .from('blog_posts')
        .select('slug, published_at')
        .order('published_at', { ascending: false }),
      this.supabase.anon.from('products').select('id, created_at').eq('active', true),
    ]);

    const staticUrls = STATIC_ROUTES.map((route) => {
      const loc = route ? `${SITE_URL}/${route}` : SITE_URL;
      return `  <url><loc>${this.escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>${route === '' ? '1.0' : '0.8'}</priority></url>`;
    });

    const postUrls = ((posts || []) as Pick<BlogPostRow, 'slug' | 'published_at'>[]).map((p) => {
      const lastmod = p.published_at
        ? `<lastmod>${this.escapeXml(p.published_at.slice(0, 10))}</lastmod>`
        : '';
      return `  <url><loc>${this.escapeXml(`${SITE_URL}/blog/${p.slug}`)}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    });

    const productUrls = ((products || []) as Pick<ProductRow, 'id' | 'created_at'>[]).map((p) => {
      const lastmod = p.created_at
        ? `<lastmod>${this.escapeXml(p.created_at.slice(0, 10))}</lastmod>`
        : '';
      return `  <url><loc>${this.escapeXml(`${SITE_URL}/tienda/${p.id}`)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls,
      ...postUrls,
      ...productUrls,
      '</urlset>',
    ].join('\n');

    res.send(xml);
  }

  @Get('products')
  async getProducts() {
    const { data } = await this.supabase.anon
      .from('products')
      .select(
        'id, name, price, source, tag, copy, description, images, affiliate_url, shipping_note, active, created_at',
      )
      .eq('active', true)
      .order('created_at', { ascending: false });

    return ((data || []) as ProductRow[]).map((row) => this.toProductView(row));
  }

  private toBlogPostView(row: BlogPostRow) {
    return {
      slug: row.slug,
      category: row.category || 'Blog',
      title: row.title,
      excerpt: row.excerpt || '',
      author: row.author || 'Mamá de Las Chubys',
      readTime: row.read_time || this.estimateReadTime(row.content || []),
      publishedAt: this.formatPostDate(row.published_at || row.created_at),
      content: Array.isArray(row.content) ? row.content : [],
      comments: [],
      coverImage: row.cover_image,
    };
  }

  private toCommentView(row: CommentRow) {
    return {
      id: row.id,
      author: row.author_name,
      body: row.body,
      date: this.formatCommentDate(row.created_at),
    };
  }

  private toProductView(row: ProductRow) {
    const priceValue = Number(row.price || 0);

    return {
      id: row.id,
      tag: row.tag || (row.source === 'owned' ? 'Las Chubys' : 'Amazon'),
      source: row.source,
      audience: this.classifyProductAudience(row),
      name: row.name,
      price: `$${priceValue.toFixed(0)}`,
      priceValue,
      copy: row.copy || '',
      description: row.description || '',
      images: Array.isArray(row.images) ? row.images : [],
      affiliateUrl: row.affiliate_url || undefined,
      shippingNote: row.shipping_note || '',
    };
  }

  private classifyProductAudience(row: Pick<ProductRow, 'name' | 'copy' | 'description' | 'tag'>) {
    const haystack =
      `${row.name} ${row.copy || ''} ${row.description || ''} ${row.tag || ''}`.toLowerCase();
    const keywords = [
      'taza',
      'mug',
      'manta',
      'decor',
      'humano',
      'camiseta',
      'hoodie',
      'poster',
      'cafe',
    ];
    return keywords.some((keyword) => haystack.includes(keyword)) ? 'michi-lovers' : 'michis';
  }

  private estimateReadTime(paragraphs: string[]) {
    const words = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 180))} min`;
  }

  private formatPostDate(value: string | null | undefined) {
    if (!value) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value));
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

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
