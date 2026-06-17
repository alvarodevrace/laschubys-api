import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { GetPostParamsDto } from './dto/get-post-params.dto';
import { MediaKitQueryDto } from './dto/media-kit-query.dto';
import { MediaKitService } from './media-kit.service';
import { MediaKitPdfService } from './media-kit-pdf.service';

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

type DbCategory = {
  id: string;
  slug: string;
  name: string;
  sort_order: number | null;
  active: boolean | null;
};

type DbProduct = {
  id: string;
  name: string;
  price: number | string;
  source: 'owned' | 'affiliate';
  tag: string | null;
  copy: string | null;
  description: string | null;
  details: string | null;
  specifications: string | null;
  images: string[] | null;
  affiliate_url: string | null;
  shipping_note: string | null;
  active: boolean;
  created_at?: string;
  category_id: string | null;
  product_type: 'physical' | 'link' | null;
  slug: string | null;
  categories?: { slug: string; name: string }[] | null;
};

@Controller('content')
export class ContentController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly mediaKitService: MediaKitService,
    private readonly mediaKitPdfService: MediaKitPdfService,
  ) {}

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
        ? await supabaseQuery.limit(Math.min(parsedLimit, 100))
        : await supabaseQuery;

    return (data || []).map((row) => this.toBlogPostView(row as DbBlogPost));
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

    const post = (posts || [])[0] as DbBlogPost | undefined;
    if (!post) {
      return null;
    }

    return {
      ...this.toBlogPostView(post),
      comments: ((comments || []) as DbComment[]).map((comment) => this.toCommentView(comment)),
    };
  }

  @Get('categories')
  async getCategories() {
    const { data, error } = await this.supabase.anon
      .from('categories')
      .select('id, slug, name, sort_order, active')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return [];
    }

    return (data || []).map((row) => this.toCategoryView(row as DbCategory));
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
      this.supabase.anon.from('products').select('slug, created_at').eq('active', true),
    ]);

    const staticUrls = STATIC_ROUTES.map((route) => {
      const loc = route ? `${SITE_URL}/${route}` : SITE_URL;
      return `  <url><loc>${this.escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>${route === '' ? '1.0' : '0.8'}</priority></url>`;
    });

    const postUrls = ((posts || []) as { slug: string; published_at: string | null }[]).map((p) => {
      const lastmod = p.published_at
        ? `<lastmod>${this.escapeXml(p.published_at.slice(0, 10))}</lastmod>`
        : '';
      return `  <url><loc>${this.escapeXml(`${SITE_URL}/blog/${p.slug}`)}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    });

    const productUrls = ((products || []) as { slug: string | null; created_at?: string }[])
      .filter((p) => p.slug)
      .map((p) => {
        const lastmod = p.created_at
          ? `<lastmod>${this.escapeXml(p.created_at.slice(0, 10))}</lastmod>`
          : '';
        return `  <url><loc>${this.escapeXml(`${SITE_URL}/tienda/${p.slug}`)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
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
  async getProducts(
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('audience') audience?: string,
    @Query('search') search?: string,
  ) {
    let query = this.supabase.anon
      .from('products')
      .select(
        'id, name, price, source, tag, copy, description, details, specifications, images, affiliate_url, shipping_note, active, created_at, category_id, product_type, slug, categories(slug, name)',
      )
      .eq('active', true);

    if (category) {
      query = query.not('category_id', 'is', null).eq('categories.slug', category);
    }

    if (type === 'physical' || type === 'link') {
      query = query.eq('product_type', type);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `name.ilike.${term},copy.ilike.${term},description.ilike.${term},tag.ilike.${term}`,
      );
    }

    const { data } = await query.order('created_at', { ascending: false });

    let products = ((data || []) as DbProduct[]).map((row) => this.toProductView(row));

    if (audience === 'michis' || audience === 'michi-lovers') {
      products = products.filter((p) => p.audience === audience);
    }

    return products;
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    const { data: products } = await this.supabase.anon
      .from('products')
      .select(
        'id, name, price, source, tag, copy, description, details, specifications, images, affiliate_url, shipping_note, active, created_at, category_id, product_type, slug, categories(slug, name)',
      )
      .eq('slug', slug)
      .eq('active', true)
      .limit(1);

    const product = (products || [])[0] as DbProduct | undefined;
    if (!product) {
      return null;
    }

    const { data: relatedProducts } = await this.supabase.anon
      .from('products')
      .select(
        'id, name, price, source, tag, copy, description, details, specifications, images, affiliate_url, shipping_note, active, created_at, category_id, product_type, slug, categories(slug, name)',
      )
      .eq('active', true)
      .eq('category_id', product.category_id ?? '')
      .neq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(8);

    return {
      ...this.toProductView(product),
      relatedProducts: ((relatedProducts || []) as DbProduct[]).map((row) =>
        this.toProductView(row),
      ),
    };
  }

  @Get('media-kit')
  async getMediaKit(@Query() query: MediaKitQueryDto) {
    return this.mediaKitService.getPublicData(query.locale);
  }

  @Get('media-kit.pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="las-chubys-media-kit.pdf"')
  async getMediaKitPdf(@Query() query: MediaKitQueryDto, @Res() res: Response) {
    const pdf = await this.mediaKitPdfService.generatePdf(query.locale);
    res.send(pdf);
  }

  private toCategoryView(row: DbCategory) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      sortOrder: row.sort_order ?? 0,
      active: row.active ?? true,
    };
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
      slug: row.slug || row.id,
      tag: row.tag || (row.source === 'owned' ? 'Las Chubys' : 'Amazon'),
      source: row.source,
      productType: row.product_type || (row.source === 'owned' ? 'physical' : 'link'),
      categoryId: row.category_id,
      categoryName: row.categories?.[0]?.name,
      audience: this.classifyProductAudience(row),
      name: row.name,
      price: `$${priceValue.toFixed(0)}`,
      priceValue,
      copy: row.copy || '',
      description: row.description || '',
      details: row.details || '',
      specifications: row.specifications || '',
      images: Array.isArray(row.images) ? row.images : [],
      affiliateUrl: row.affiliate_url || undefined,
      shippingNote: row.shipping_note || '',
    };
  }

  private classifyProductAudience(row: Pick<DbProduct, 'name' | 'copy' | 'description' | 'tag'>) {
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
