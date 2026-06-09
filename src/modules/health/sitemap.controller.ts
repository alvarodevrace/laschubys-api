import { Controller, Get, Header } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  priority: string;
}

@Controller('sitemap.xml')
export class SitemapController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  @Header('Content-Type', 'application/xml')
  async sitemap(): Promise<string> {
    const urls: SitemapUrl[] = [
      { loc: 'https://laschubys.com/', priority: '1.0' },
      { loc: 'https://laschubys.com/blog', priority: '0.8' },
      { loc: 'https://laschubys.com/tienda', priority: '0.8' },
      { loc: 'https://laschubys.com/about', priority: '0.6' },
      { loc: 'https://laschubys.com/servicios', priority: '0.6' },
      { loc: 'https://laschubys.com/contact', priority: '0.6' },
    ];

    try {
      const { data: posts } = await this.supabase.admin
        .from('blog_posts')
        .select('slug, published_at')
        .not('published_at', 'is', null);

      if (posts) {
        for (const p of posts) {
          urls.push({
            loc: `https://laschubys.com/blog/${p.slug}`,
            lastmod: p.published_at
              ? new Date(p.published_at).toISOString().split('T')[0]
              : undefined,
            priority: '0.7',
          });
        }
      }
    } catch {
      /* ignore */
    }

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls.map(
        (u) =>
          `  <url>\n    <loc>${this.escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n    <priority>${u.priority}</priority>\n  </url>`,
      ),
      `</urlset>`,
    ].join('\n');

    return xml;
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
