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
    ];

    try {
      const { data: products } = await this.supabase.admin
        .from('products')
        .select('slug, updated_at')
        .eq('active', true);

      if (products) {
        for (const p of products) {
          urls.push({
            loc: `https://laschubys.com/producto/${p.slug}`,
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined,
            priority: '0.8',
          });
        }
      }
    } catch { /* ignore */ }

    try {
      const { data: posts } = await this.supabase.admin
        .from('posts')
        .select('slug, updated_at')
        .eq('published', true);

      if (posts) {
        for (const p of posts) {
          urls.push({
            loc: `https://laschubys.com/blog/${p.slug}`,
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined,
            priority: '0.7',
          });
        }
      }
    } catch { /* ignore */ }

    const xml = [`<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls.map(u =>
        `  <url>\n    <loc>${this.escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n    <priority>${u.priority}</priority>\n  </url>`
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
