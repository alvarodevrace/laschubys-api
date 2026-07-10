import { Injectable } from '@nestjs/common';
import { MediaKitData, MediaKitService } from './media-kit.service';

@Injectable()
export class MediaKitPdfService {
  private readonly gotenbergUrl =
    process.env.GOTENBERG_URL || 'https://gotenberg.alvarodevrace.tech/forms/chromium/convert/html';

  constructor(private readonly mediaKitService: MediaKitService) {}

  async generatePdf(locale?: string, baseUrl = 'https://laschubys.com'): Promise<Buffer> {
    const data = await this.mediaKitService.getMediaKit(locale);
    const html = this.buildHtml(data, baseUrl);

    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    form.append('chromium-print-background', 'true');
    form.append('paperWidth', '8.27in');
    form.append('paperHeight', '11.69in');
    form.append('marginTop', '0');
    form.append('marginBottom', '0');
    form.append('marginLeft', '0');
    form.append('marginRight', '0');

    const response = await fetch(this.gotenbergUrl, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown error');
      throw new Error(`Gotenberg error ${response.status}: ${text}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private buildHtml(data: MediaKitData, baseUrl: string): string {
    const imageUrl = (src: string) => (src.startsWith('http') ? src : `${baseUrl}${src}`);
    const metricsRows = data.metrics
      .map(
        (m) => `
      <div style="background:#fff;border:1px solid #f0e6dd;border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#ff7a1a;text-transform:uppercase;">${this.escapeHtml(m.network)}</p>
        <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#141313;">${this.escapeHtml(m.value)}</p>
        <p style="margin:0;font-size:12px;color:#666;">${this.escapeHtml(m.label)}</p>
        ${m.engagement ? `<p style="margin:8px 0 0;font-size:11px;color:#999;">Engagement ${this.escapeHtml(m.engagement)}</p>` : ''}
      </div>
    `,
      )
      .join('');

    const servicesRows = data.services
      .map(
        (s) => `
      <div style="background:#fff;border:1px solid #f0e6dd;border-radius:12px;padding:16px;">
        <h3 style="margin:0 0 6px;font-size:16px;font-weight:800;color:#141313;">${this.escapeHtml(s.name)}</h3>
        <p style="margin:0 0 10px;font-size:12px;color:#666;line-height:1.5;">${this.escapeHtml(s.description)}</p>
        <ul style="margin:0;padding-left:18px;font-size:12px;color:#555;line-height:1.6;">
          ${s.deliverables.map((d) => `<li>${this.escapeHtml(d)}</li>`).join('')}
        </ul>
      </div>
    `,
      )
      .join('');

    const ratesRows = data.rates
      .map(
        (r) => `
      <div style="background:${r.recommended ? '#fff4e8' : '#fff'};border:2px solid ${r.recommended ? '#ff7a1a' : '#f0e6dd'};border-radius:16px;padding:20px;text-align:center;">
        <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#141313;">${this.escapeHtml(r.name)}</h3>
        <p style="margin:0 0 4px;font-size:32px;font-weight:800;color:#ff7a1a;">${this.escapeHtml(r.price)}</p>
        <p style="margin:0 0 12px;font-size:12px;color:#666;">${this.escapeHtml(r.description)}</p>
        <ul style="margin:0;padding-left:18px;font-size:12px;color:#555;line-height:1.6;text-align:left;">
          ${r.features.map((f) => `<li>${this.escapeHtml(f)}</li>`).join('')}
        </ul>
      </div>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Media Kit — Las Chubys</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Open Sans', sans-serif; color: #333; background: #fff; }
    .page { width: 210mm; min-height: 297mm; padding: 40px; position: relative; }
    .brand { color: #ff7a1a; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    h1 { font-size: 42px; font-weight: 800; color: #141313; margin: 8px 0 16px; line-height: 1.1; }
    h2 { font-size: 22px; font-weight: 800; color: #141313; margin: 0 0 16px; }
    p { margin: 0 0 12px; line-height: 1.6; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .hero { background: #fff4e8; border-radius: 24px; padding: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; margin-bottom: 32px; }
    .hero img { width: 100%; height: 320px; object-fit: cover; border-radius: 20px; }
    .pill { display: inline-block; background: #ff7a1a; color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .cta { display: inline-block; background: #ff7a1a; color: #fff; padding: 12px 24px; border-radius: 999px; font-weight: 700; text-decoration: none; margin-top: 8px; }
    .section { margin-bottom: 32px; }
    .footer { background: #141313; color: #fff; border-radius: 20px; padding: 32px; text-align: center; margin-top: 32px; }
    .footer a { color: #ff7a1a; text-decoration: none; font-weight: 700; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <div>
        <span class="pill">${this.escapeHtml(data.hero.pill)}</span>
        <h1>${this.escapeHtml(data.hero.title)}</h1>
        <p style="font-size:16px;color:#555;">${this.escapeHtml(data.hero.subtitle)}</p>
        <a href="mailto:${this.escapeHtml(data.contact.email)}" class="cta">Escríbenos</a>
      </div>
      <img src="${this.escapeHtml(imageUrl(data.hero.image))}" alt="${this.escapeHtml(data.hero.imageAlt)}">
    </div>

    <div class="section">
      <p class="brand">Alcance</p>
      <h2>Números que importan</h2>
      <div class="grid-4">
        ${metricsRows}
      </div>
    </div>

    <div class="section">
      <p class="brand">Nosotros</p>
      <h2>${this.escapeHtml(data.about.headline)}</h2>
      <p style="font-size:14px;color:#555;max-width:90%;">${this.escapeHtml(data.about.story)}</p>
    </div>

    <div class="section">
      <p class="brand">Audiencia</p>
      <h2>¿A quién llegamos?</h2>
      <div class="grid-4" style="margin-bottom:16px;">
        ${data.audience.demographics
          .map(
            (d) => `
          <div style="text-align:center;background:#fff4e8;border-radius:12px;padding:14px;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#ff7a1a;">${this.escapeHtml(d.value)}</p>
            <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#141313;">${this.escapeHtml(d.label)}</p>
            <p style="margin:0;font-size:10px;color:#666;">${this.escapeHtml(d.detail)}</p>
          </div>
        `,
          )
          .join('')}
      </div>
      <div class="grid-3">
        ${data.audience.segments
          .map(
            (s) => `
          <div style="border:1px solid #f0e6dd;border-radius:12px;padding:14px;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:800;color:#141313;">${this.escapeHtml(s.title)}</p>
            <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">${this.escapeHtml(s.description)}</p>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>

    <div class="section">
      <p class="brand">Servicios</p>
      <h2>¿Qué podemos crear juntos?</h2>
      <div class="grid-3">
        ${servicesRows}
      </div>
    </div>

    <div class="section">
      <p class="brand">Tarifas</p>
      <h2>Packs de colaboración</h2>
      <div class="grid-3">
        ${ratesRows}
      </div>
    </div>

    <div class="footer">
      <h2 style="color:#fff;">Hagamos algo juntos</h2>
      <p style="color:#ccc;font-size:14px;">Cuéntanos tu idea, producto o campaña. Armamos una propuesta a la medida.</p>
      <p style="margin-top:16px;">
        <a href="mailto:${this.escapeHtml(data.contact.email)}">${this.escapeHtml(data.contact.email)}</a>
        &nbsp;·&nbsp;
        <a href="${this.escapeHtml(data.contact.whatsapp)}">${this.escapeHtml(data.contact.whatsappLabel)}</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
