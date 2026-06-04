import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

const SITE_URL = 'https://laschubys.com';
const STATIC_ROUTES = ['', 'tienda', 'blog', 'about', 'servicios', 'contact'];

type DbBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string[] | null;
  category: string | null;
  read_time: string | null;
  cover_image: string | null;
  author: string;
  published_at: string | null;
  created_at?: string;
};

type DbComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

type DbProduct = {
  id: string;
  name: string;
  price: number | string;
  source: 'owned' | 'affiliate';
  tag: string | null;
  copy: string | null;
  description: string | null;
  images: string[] | null;
  affiliate_url: string | null;
  shipping_note: string | null;
  active: boolean;
  created_at?: string;
};

@Controller('content')
export class ContentController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('posts')
  async getPosts(@Query('limit') limit?: string) {
    const query = this.supabase.anon
      .from('blog_posts')
      .select('id, slug, title, excerpt, content, category, read_time, cover_image, author, published_at, created_at')
      .order('published_at', { ascending: false });

    const parsedLimit = Number(limit);
    const { data } = Number.isFinite(parsedLimit) && parsedLimit > 0 ? await query.limit(parsedLimit) : await query;

    return (data || []).map((row) => this.toBlogPostView(row as DbBlogPost));
  }

  @Get('posts/:slug')
  async getPost(@Param('slug') slug: string) {
    const [{ data: posts }, { data: comments }] = await Promise.all([
      this.supabase.anon
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, category, read_time, cover_image, author, published_at, created_at')
        .eq('slug', slug)
        .limit(1),
      this.supabase.anon
        .from('comments')
        .select('id, author_name, body, created_at')
        .eq('post_slug', slug)
        .eq('reported', false)
        .order('created_at', { ascending: false }),
    ]);

    const post = (posts || [])[0] as DbBlogPost | undefined;
    if (!post) {
      return null;
    }

    return {
      ...this.toBlogPostView(post),
      comments: ((comments || []) as DbComment[]).map((comment) => this.toCommentView(comment)),
    };
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getSitemap(@Res() res: Response) {
    const [{ data: posts }, { data: products }] = await Promise.all([
      this.supabase.anon.from('blog_posts').select('slug, published_at').order('published_at', { ascending: false }),
      this.supabase.anon.from('products').select('id, created_at').eq('active', true),
    ]);

    const staticUrls = STATIC_ROUTES.map((route) => {
      const loc = route ? `${SITE_URL}/${route}` : SITE_URL;
      return `  <url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${route === '' ? '1.0' : '0.8'}</priority></url>`;
    });

    const postUrls = ((posts || []) as { slug: string; published_at: string | null }[]).map((p) => {
      const lastmod = p.published_at ? `<lastmod>${p.published_at.slice(0, 10)}</lastmod>` : '';
      return `  <url><loc>${SITE_URL}/blog/${p.slug}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    });

    const productUrls = ((products || []) as { id: string; created_at?: string }[]).map((p) => {
      const lastmod = p.created_at ? `<lastmod>${p.created_at.slice(0, 10)}</lastmod>` : '';
      return `  <url><loc>${SITE_URL}/tienda/${p.id}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
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
      .select('id, name, price, source, tag, copy, description, images, affiliate_url, shipping_note, active, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false });

    return ((data || []) as DbProduct[]).map((row) => this.toProductView(row));
  }

  private toBlogPostView(row: DbBlogPost) {
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

  private toCommentView(row: DbComment) {
    return {
      id: row.id,
      author: row.author_name,
      body: row.body,
      date: this.formatCommentDate(row.created_at),
    };
  }

  private toProductView(row: DbProduct) {
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

  private classifyProductAudience(row: Pick<DbProduct, 'name' | 'copy' | 'description' | 'tag'>) {
    const haystack = `${row.name} ${row.copy || ''} ${row.description || ''} ${row.tag || ''}`.toLowerCase();
    const keywords = ['taza', 'mug', 'manta', 'decor', 'humano', 'camiseta', 'hoodie', 'poster', 'cafe'];
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
}
