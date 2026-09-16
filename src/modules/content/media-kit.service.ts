import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface MediaKitHeroCta {
  label: string;
  href: string;
}

export interface MediaKitHero {
  title: string;
  subtitle: string;
  pill: string;
  image: string;
  imageAlt: string;
  ctaDownload: MediaKitHeroCta;
  ctaWrite: MediaKitHeroCta;
}

export interface MediaKitMetric {
  network: string;
  handle: string;
  value: string;
  label: string;
  engagement?: string;
  href?: string;
}

export interface MediaKitTeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export interface MediaKitAbout {
  headline: string;
  story: string;
  team: MediaKitTeamMember[];
}

export interface MediaKitAudienceSegment {
  title: string;
  description: string;
  icon: string;
}

export interface MediaKitDemographic {
  label: string;
  value: string;
  detail: string;
}

export interface MediaKitAudience {
  segments: MediaKitAudienceSegment[];
  demographics: MediaKitDemographic[];
}

export interface MediaKitContentItem {
  title: string;
  image: string;
  metric: string;
}

export interface MediaKitServiceItem {
  name: string;
  description: string;
  deliverables: string[];
}

export interface MediaKitRate {
  name: string;
  priceUsd: number;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface MediaKitContact {
  email: string;
  whatsapp: string;
  whatsappLabel: string;
  /** Campos del nuevo contacto (diseño PDF) — opcionales. */
  website?: string;
  phone?: string;
  location?: string;
}

export interface MediaKitData {
  hero: MediaKitHero;
  metrics: MediaKitMetric[];
  about: MediaKitAbout;
  audience: MediaKitAudience;
  content: MediaKitContentItem[];
  services: MediaKitServiceItem[];
  rates: MediaKitRate[];
  contact: MediaKitContact;
  /** Secciones nuevas (diseño PDF media kit) — opcionales para compatibilidad. */
  cover?: MediaKitPdfCover;
  socialMetrics?: MediaKitPdfNetwork[];
  audienceOverview?: MediaKitPdfAudience;
  collabFormats?: MediaKitPdfCollabFormats;
  houseFormats?: MediaKitPdfHouseFormats;
}

export type MediaKitPublicData = Omit<MediaKitData, 'rates'>;

// ---------------------------------------------------------------------------
// Contrato del rediseño media kit (versión PDF, datos dinámicos desde la base)
// ---------------------------------------------------------------------------

export interface MediaKitPdfCover {
  title: string;
  subtitle: string;
  photos: Array<{ name: string; image: string }>;
}

export interface MediaKitPdfNetwork {
  name: string;
  handle: string;
  followers: string;
  engagement: string;
  reachMonthly: string;
  viewsMonthly: string;
  href?: string;
}

export interface MediaKitPdfAudience {
  countriesCount: string;
  countriesLabel: string;
  femalePercent: string;
  femaleLabel: string;
  ageRange: string;
  ageLabel: string;
  countries: string[];
}

export interface MediaKitPdfCollabItem {
  title: string;
  description: string;
}

export interface MediaKitPdfCollabFormats {
  title: string;
  intro: string;
  items: MediaKitPdfCollabItem[];
}

export interface MediaKitPdfHouseFormats {
  title: string;
  growthNote: string;
  items: Array<{ title: string }>;
}

export interface MediaKitConfigRecord {
  id: string;
  key: string;
  data: Record<string, unknown>;
  updated_at: string;
}

const DEFAULT_MEDIA_KIT_CONFIG_RECORDS: MediaKitConfigRecord[] = [
  {
    id: 'default-social-metrics',
    key: 'social_metrics',
    updated_at: new Date().toISOString(),
    data: {
      items: [
        {
          platform: 'instagram',
          account: '@laschubys',
          metric: '17K',
          label: 'seguidores',
          href: 'https://www.instagram.com/laschubys/',
          engagement: '4-7%',
        },
        {
          platform: 'tiktok',
          account: '@laschubys.oficial',
          metric: '14.4K',
          label: 'seguidores · 609K likes',
          href: 'https://www.tiktok.com/@laschubys.oficial',
          engagement: '4-7%',
        },
        {
          platform: 'facebook',
          account: 'Las Chubys',
          metric: '2.6K',
          label: 'seguidores',
          href: 'https://www.facebook.com/people/Las-Chubys/61589964727281/',
          engagement: '4-7%',
        },
        {
          platform: 'engagement',
          account: 'promedio',
          metric: '4-7%',
          label: 'engagement orgánico',
          href: 'https://www.instagram.com/laschubys/',
        },
      ],
    },
  },
  {
    id: 'default-audience',
    key: 'audience',
    updated_at: new Date().toISOString(),
    data: {
      female: '91%',
      male: '9%',
      topCountries: [
        { country: 'Ecuador', percentage: '60%' },
        { country: 'Estados Unidos', percentage: '15%' },
        { country: 'México', percentage: '10%' },
        { country: 'Colombia', percentage: '8%' },
        { country: 'Otros', percentage: '7%' },
      ],
      topCities: [
        { city: 'Guayaquil', percentage: '35%' },
        { city: 'Quito', percentage: '22%' },
        { city: 'Cuenca', percentage: '8%' },
      ],
    },
  },
  {
    id: 'default-content-pillars',
    key: 'content_pillars',
    updated_at: new Date().toISOString(),
    data: {
      items: [
        'Reviews honestos',
        'Comparativas',
        'Tutoriales',
        'Lifestyle',
        'Unboxing',
        'Recomendaciones',
      ],
    },
  },
  {
    id: 'default-services',
    key: 'services',
    updated_at: new Date().toISOString(),
    data: {
      items: [
        {
          title: 'Publicidad',
          description: 'Integración natural de productos en contenido orgánico.',
          deliverables: ['Storytelling de marca', '1 reel integrado', '3 stories de respaldo'],
        },
        {
          title: 'Reseñas',
          description: 'Opinión real y detallada dirigida a una comunidad de compradores.',
          deliverables: ['Reel o carrusel', 'Copy honesto', 'Stories con CTA'],
        },
        {
          title: 'Colaboraciones',
          description: 'Campañas creativas a medida con la esencia de Las Chubys.',
          deliverables: ['Brief personalizado', 'Pack de contenido', 'Reporte de métricas'],
        },
      ],
    },
  },
  {
    id: 'default-contact',
    key: 'contact',
    updated_at: new Date().toISOString(),
    data: {
      website: 'www.laschubys.com',
      phone: '+593 99 213 1011',
      email: 'laschubys.oficial@gmail.com',
      location: 'Ecuador para audiencia LATAM',
    },
  },
  {
    id: 'default-cover',
    key: 'cover',
    updated_at: new Date().toISOString(),
    data: {
      title: 'Reality show felino',
      subtitle:
        'Protagonizado por Iris Lourdes y Rubí Lucrecia, dos gatitas de personalidades opuestas que convierten lo cotidiano en drama épico.',
      photos: [
        { name: 'Rubí', image: '/images/cats/rubi.jpeg' },
        { name: 'Iris', image: '/images/cats/iris.jpeg' },
      ],
    },
  },
  {
    id: 'default-metrics',
    key: 'metrics',
    updated_at: new Date().toISOString(),
    data: {
      asOf: 'Julio 2026',
      networks: [
        {
          name: 'Instagram',
          handle: '@laschubys',
          followers: '31.3k',
          engagement: '21%',
          reachMonthly: '963K',
          viewsMonthly: '1.8M',
          href: 'https://www.instagram.com/laschubys/',
        },
        {
          name: 'Facebook',
          handle: 'Las Chubys',
          followers: '3.8K',
          engagement: '9.9%',
          reachMonthly: '203.8K',
          viewsMonthly: '338.5K',
          href: 'https://www.facebook.com/people/Las-Chubys/61589964727281/',
        },
        {
          name: 'TikTok',
          handle: '@laschubys.oficial',
          followers: '23K',
          engagement: '12.9%',
          reachMonthly: '35.5K',
          viewsMonthly: '1.1M',
          href: 'https://www.tiktok.com/@laschubys.oficial',
        },
      ],
    },
  },
  {
    id: 'default-collab-formats',
    key: 'collab_formats',
    updated_at: new Date().toISOString(),
    data: {
      title: 'Formatos de colaboración',
      intro:
        'Cada colaboración es única y los valores varían según el alcance, derechos y formatos incluidos. Cuéntanos qué necesita tu marca y encontramos la mejor forma de integrarlo al universo Chuby.',
      items: [
        {
          title: 'Gifting (Regalo)',
          description:
            'La marca envía su producto para ser usado por Iris Lourdes o Rubí Lucrecia en contenido orgánico dentro del universo Chuby.',
        },
        {
          title: 'Historias mencionando marca',
          description:
            'Pack mínimo de 3 historias con mención, etiqueta y/o link directo a la marca.',
        },
        {
          title: 'Reel/TikTok Patrocinado',
          description:
            'Video dedicado, protagonizado por las gatas con integración natural del producto dentro de una de las series de La Casa Chuby.',
        },
        {
          title: 'UGC',
          description:
            'Contenido grabado por Las Chubys para uso exclusivo de la marca en sus propias redes, web o anuncios pagados (sin publicación en la cuenta de Las Chubys).',
        },
        {
          title: 'Embajador mensual',
          description:
            'Campaña completa mensual que incluye reels, historias y presencia continua de la marca dentro del universo Chuby.',
        },
        {
          title: 'Afiliados',
          description:
            'La marca asigna un código o link exclusivo de Las Chubys. Se genera comisión por cada venta referida.',
        },
      ],
    },
  },
  {
    id: 'default-house-formats',
    key: 'house_formats',
    updated_at: new Date().toISOString(),
    data: {
      title: 'Formatos de La Casa Chuby',
      growthNote: '100% crecimiento orgánico',
      items: [
        { title: 'Método MIAU' },
        { title: 'Noticias de última hora' },
        { title: 'Expedientes Chuby' },
        { title: 'Recursos felinos' },
        { title: 'Carrusel' },
        { title: 'Historias' },
      ],
    },
  },
];

@Injectable()
export class MediaKitService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly staticData: MediaKitData = {
    hero: {
      title: 'Las Chubys · Media Kit',
      subtitle:
        'Contenido felino con alma: memes, recomendaciones, reviews y storytelling que conecta con cat moms y marcas en LATAM.',
      pill: 'Ecuador · LATAM',
      image: '/images/cats/iris2.jpeg',
      imageAlt: 'Iris y Rubi, las gatas de Las Chubys',
      ctaDownload: {
        label: 'Descargar media kit',
        href: '#contacto',
      },
      ctaWrite: {
        label: 'Escríbenos',
        href: 'mailto:hola@laschubys.com',
      },
    },
    metrics: [
      {
        network: 'Instagram',
        handle: '@laschubys',
        value: '17K',
        label: 'seguidores',
        engagement: '4-7%',
        href: 'https://www.instagram.com/laschubys/',
      },
      {
        network: 'TikTok',
        handle: '@laschubys.oficial',
        value: '14.4K',
        label: 'seguidores · 609K likes',
        engagement: '4-7%',
        href: 'https://www.tiktok.com/@laschubys.oficial',
      },
      {
        network: 'Facebook',
        handle: 'Las Chubys',
        value: '2.6K',
        label: 'seguidores',
        engagement: '4-7%',
        href: 'https://www.facebook.com/people/Las-Chubys/61589964727281/',
      },
      {
        network: 'Engagement',
        handle: 'Promedio mensual',
        value: '4-7%',
        label: 'engagement orgánico',
        href: 'https://www.instagram.com/laschubys/',
      },
    ],
    about: {
      headline: '¿Quiénes son Las Chubys?',
      story:
        'Las Chubys nació como un rincón para compartir el día a día de dos gatas con mucha personalidad. Álvaro y Brenda pusieron la estrategia, la cámara y las ideas; Iris y Rubi pusieron el drama, las siestas tácticas y los zoomies virales. Hoy somos una comunidad de cat moms, pet parents y marcas que creen en contenido auténtico, divertido y con propósito.',
      team: [
        {
          name: 'Álvaro',
          role: 'Estrategia & tecnología',
          image: '/images/cats/iris3.jpeg',
          bio: 'Creador, editor y el humano que convierte el caos felino en una marca con estructura.',
        },
        {
          name: 'Brenda',
          role: 'Creatividad & comunidad',
          image: '/images/cats/rubi3.jpeg',
          bio: 'Voz detrás de los captions, las stories y la conexión real con la audiencia.',
        },
        {
          name: 'Iris',
          role: 'La Seria',
          image: '/images/cats/iris.jpeg',
          bio: 'Drama elegante, siestas tácticas y mirada de CEO felina. La protagonista del feed.',
        },
        {
          name: 'Rubi',
          role: 'La Revoltosa',
          image: '/images/cats/rubi.jpeg',
          bio: 'Energía impredecible, zoomies nocturnos y encanto absoluto. Reina del TikTok.',
        },
      ],
    },
    audience: {
      segments: [
        {
          title: 'Cat lovers',
          description:
            'Amantes de los gatos que buscan contenido cute, tips y productos recomendados.',
          icon: 'heart',
        },
        {
          title: 'Pet parents',
          description: 'Dueños de mascotas que quieren mejorar la vida de sus peludos con estilo.',
          icon: 'users',
        },
        {
          title: 'Marcas locales',
          description:
            'Emprendimientos y marcas de Ecuador y LATAM que quieren llegar a una comunidad fiel.',
          icon: 'briefcase',
        },
      ],
      demographics: [
        { label: 'Ecuador', value: '60%', detail: 'Audiencia principal' },
        { label: 'México', value: '20%', detail: 'Segundo mercado' },
        { label: 'Colombia', value: '12%', detail: 'En crecimiento' },
        { label: 'Otros', value: '8%', detail: 'Resto de LATAM' },
      ],
    },
    content: [
      { title: 'Reels', image: '/images/cats/iris2.jpeg', metric: 'Mayor alcance' },
      { title: 'TikTok', image: '/images/cats/rubi2.jpeg', metric: 'Alta viralidad' },
      { title: 'Stories', image: '/images/cats/iris4.jpeg', metric: 'Conexión diaria' },
      { title: 'UGC', image: '/images/cats/rubi4.jpeg', metric: 'Confianza de marca' },
    ],
    services: [
      {
        name: 'Post feed',
        description: 'Publicación permanente en Instagram con foto, copy y etiquetado de marca.',
        deliverables: ['1 foto o carrusel', 'Copy optimizado', '3 stories de respaldo'],
      },
      {
        name: 'Reel',
        description: 'Video corto vertical para Instagram con edición, audio trending y hooks.',
        deliverables: ['1 reel 15-60s', 'Edición incluida', 'Stories + link en bio'],
      },
      {
        name: 'TikTok',
        description: 'Contenido nativo para TikTok pensado para viralización y descubrimiento.',
        deliverables: ['1 video 15-90s', 'Trends adaptados', 'Duet/stitch opcional'],
      },
      {
        name: 'Stories',
        description: 'Secuencia de stories interactivas con encuestas, enlaces y CTA claros.',
        deliverables: ['3-5 stories', 'Stickers interactivos', 'Swipe-up / link'],
      },
      {
        name: 'UGC',
        description: 'Contenido generado por Las Chubys para que la marca lo use en sus canales.',
        deliverables: ['1-3 videos', 'Derechos de uso', 'Raw footage opcional'],
      },
      {
        name: 'Embajadoría',
        description: 'Colaboración de largo plazo: contenido recurrente, activaciones y reportes.',
        deliverables: ['Pack mensual', 'Reporte de métricas', 'Prioridad en calendario'],
      },
    ],
    rates: [
      {
        name: 'Starter',
        priceUsd: 120,
        price: 'USD 120',
        description: 'Ideal para una primera colaboración o lanzamiento puntual.',
        features: ['1 post feed + 3 stories', '1 reel o TikTok', 'Reporte básico'],
      },
      {
        name: 'Growth',
        priceUsd: 280,
        price: 'USD 280',
        description: 'Mayor alcance combinando formatos para maximizar visibilidad.',
        features: [
          '2 posts feed + stories',
          '2 reels / TikToks',
          'Reporte de métricas',
          'Link en bio 7 días',
        ],
        recommended: true,
      },
      {
        name: 'Embajador',
        priceUsd: 650,
        price: 'USD 650',
        description: 'Sociedad mensual con contenido recurrente y estrategia conjunta.',
        features: [
          '4 posts + 8 stories',
          '4 reels / TikToks',
          'Reporte mensual',
          'Prioridad creativa',
          'Reuniones de planificación',
        ],
      },
    ],
    contact: {
      email: 'hola@laschubys.com',
      whatsapp: 'https://wa.me/593960463743',
      whatsappLabel: '+593 96 046 3743',
    },
  };

  async getMediaKit(_locale?: string): Promise<MediaKitData> {
    return this.buildMediaKitData();
  }

  async getPublicData(_locale?: string): Promise<MediaKitPublicData> {
    const { rates: _rates, ...publicData } = await this.buildMediaKitData();
    return publicData;
  }

  async getAdminConfig(): Promise<MediaKitConfigRecord[]> {
    const { data, error } = await this.supabase.admin
      .from('media_kit_config')
      .select('id, key, data, updated_at')
      .order('key', { ascending: true });

    if (error) {
      if (error.message?.includes('Could not find the table')) {
        return DEFAULT_MEDIA_KIT_CONFIG_RECORDS;
      }

      throw new Error(`No se pudo cargar la configuración del media kit: ${error.message}`);
    }

    return (data || []) as MediaKitConfigRecord[];
  }

  async updateAdminConfig(
    key: string,
    data: Record<string, unknown>,
  ): Promise<MediaKitConfigRecord> {
    const { data: rows, error: upsertError } = await this.supabase.admin
      .from('media_kit_config')
      .upsert({ key, data } as never, { onConflict: 'key' })
      .select('id, key, data, updated_at');

    if (upsertError) {
      throw new Error(`No se pudo actualizar la configuración: ${upsertError.message}`);
    }

    const record = ((rows || []) as unknown[])[0] as MediaKitConfigRecord | undefined;

    if (!record) {
      throw new NotFoundException(`No se pudo guardar la configuración para la clave ${key}`);
    }

    return record;
  }

  private async buildMediaKitData(): Promise<MediaKitData> {
    const overrides = await this.loadConfigMap();

    const metrics = this.parseMetrics(overrides.get('social_metrics'));
    const audience = this.parseAudience(overrides.get('audience'));
    const contentPillars = this.parseContentPillars(overrides.get('content_pillars'));
    const services = this.parseServices(overrides.get('services'));
    const contact = this.parseContact(overrides.get('contact'));

    const cover = this.parseCover(overrides.get('cover'));
    const socialMetrics = this.parseSocialMetrics(overrides.get('metrics'));
    const audienceOverview = this.parseAudienceOverview(overrides.get('audience'));
    const collabFormats = this.parseCollabFormats(overrides.get('collab_formats'));
    const houseFormats = this.parseHouseFormats(overrides.get('house_formats'));

    return {
      hero: this.staticData.hero,
      metrics: metrics.length > 0 ? metrics : this.staticData.metrics,
      about: this.staticData.about,
      audience,
      content: contentPillars.length > 0 ? contentPillars : this.staticData.content,
      services: services.length > 0 ? services : this.staticData.services,
      rates: this.staticData.rates,
      contact,
      cover,
      socialMetrics,
      audienceOverview,
      collabFormats,
      houseFormats,
    };
  }

  private async loadConfigMap(): Promise<Map<string, Record<string, unknown>>> {
    try {
      const { data, error } = await this.supabase.anon.from('media_kit_config').select('key, data');

      if (error || !data) {
        console.error('[MediaKitService] Error cargando media_kit_config:', error);
        return new Map();
      }

      return new Map(
        (data as unknown as { key: string; data: Record<string, unknown> }[]).map((row) => [
          row.key,
          row.data || {},
        ]),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Could not find the table')) {
        return new Map(DEFAULT_MEDIA_KIT_CONFIG_RECORDS.map((row) => [row.key, row.data]));
      }

      console.error('[MediaKitService] Excepción cargando media_kit_config:', err);
      return new Map();
    }
  }

  private parseMetrics(raw: Record<string, unknown> | undefined): MediaKitMetric[] {
    const items = raw?.['items'];

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item): item is Record<string, string> => typeof item === 'object' && item !== null)
      .map((item) => ({
        network: String(item['platform'] || item['network'] || ''),
        handle: String(item['account'] || item['handle'] || ''),
        value: String(item['metric'] || item['value'] || ''),
        label: String(item['label'] || ''),
        engagement: item['engagement'] ? String(item['engagement']) : undefined,
        href: item['href'] ? String(item['href']) : undefined,
      }))
      .filter((item) => item.network && item.value);
  }

  private parseAudience(raw: Record<string, unknown> | undefined): MediaKitAudience {
    const staticAudience = this.staticData.audience;
    const female = raw?.['female'];
    const male = raw?.['male'];
    const topCountries = Array.isArray(raw?.['topCountries']) ? raw['topCountries'] : [];
    const topCities = Array.isArray(raw?.['topCities']) ? raw['topCities'] : [];

    const demographics: MediaKitDemographic[] = [];

    if (typeof female === 'string' || typeof female === 'number') {
      demographics.push({
        label: 'Femenino',
        value: String(female),
        detail: 'Audiencia principal',
      });
    }

    if (typeof male === 'string' || typeof male === 'number') {
      demographics.push({
        label: 'Masculino',
        value: String(male),
        detail: 'Resto de la audiencia',
      });
    }

    for (const country of topCountries) {
      if (country && typeof country === 'object') {
        const label = String((country as Record<string, unknown>)['country'] || '');
        const value = String((country as Record<string, unknown>)['percentage'] || '');
        if (label && value) {
          demographics.push({ label, value, detail: 'País' });
        }
      }
    }

    for (const city of topCities) {
      if (city && typeof city === 'object') {
        const label = String((city as Record<string, unknown>)['city'] || '');
        const value = String((city as Record<string, unknown>)['percentage'] || '');
        if (label && value) {
          demographics.push({ label, value, detail: 'Ciudad' });
        }
      }
    }

    return {
      segments: staticAudience.segments,
      demographics: demographics.length > 0 ? demographics : staticAudience.demographics,
    };
  }

  private parseContentPillars(raw: Record<string, unknown> | undefined): MediaKitContentItem[] {
    const items = raw?.['items'];

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item): item is string => typeof item === 'string')
      .map((title) => ({
        title,
        image: '/images/cats/iris2.jpeg',
        metric: 'Contenido',
      }));
  }

  private parseServices(raw: Record<string, unknown> | undefined): MediaKitServiceItem[] {
    const items = raw?.['items'];

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        name: String(item['title'] || item['name'] || ''),
        description: String(item['description'] || ''),
        deliverables: Array.isArray(item['deliverables'])
          ? item['deliverables'].map((d) => String(d))
          : [],
      }))
      .filter((item) => item.name);
  }

  private parseContact(raw: Record<string, unknown> | undefined): MediaKitContact {
    const email =
      typeof raw?.['email'] === 'string' && raw['email']
        ? raw['email']
        : this.staticData.contact.email;

    return {
      email,
      whatsapp: this.staticData.contact.whatsapp,
      whatsappLabel: this.staticData.contact.whatsappLabel,
      website: typeof raw?.['website'] === 'string' ? raw['website'] : undefined,
      phone: typeof raw?.['phone'] === 'string' ? raw['phone'] : undefined,
      location: typeof raw?.['location'] === 'string' ? raw['location'] : undefined,
    };
  }

  private parseCover(raw: Record<string, unknown> | undefined): MediaKitPdfCover {
    const title = typeof raw?.['title'] === 'string' ? raw['title'] : '';
    const subtitle = typeof raw?.['subtitle'] === 'string' ? raw['subtitle'] : '';
    const photos = Array.isArray(raw?.['photos'])
      ? raw['photos']
          .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
          .map((p) => ({
            name: String(p['name'] || ''),
            image: String(p['image'] || ''),
          }))
          .filter((p) => p.name && p.image)
      : [];

    return { title, subtitle, photos };
  }

  private parseSocialMetrics(raw: Record<string, unknown> | undefined): MediaKitPdfNetwork[] {
    const networks = Array.isArray(raw?.['networks']) ? raw['networks'] : [];

    return networks
      .filter((n): n is Record<string, unknown> => typeof n === 'object' && n !== null)
      .map((n) => ({
        name: String(n['name'] || ''),
        handle: String(n['handle'] || ''),
        followers: String(n['followers'] || ''),
        engagement: String(n['engagement'] || ''),
        reachMonthly: String(n['reachMonthly'] || ''),
        viewsMonthly: String(n['viewsMonthly'] || ''),
        href: n['href'] ? String(n['href']) : undefined,
      }))
      .filter((n) => n.name);
  }

  private parseAudienceOverview(raw: Record<string, unknown> | undefined): MediaKitPdfAudience {
    const countries = Array.isArray(raw?.['countries'])
      ? raw['countries'].filter((c): c is string => typeof c === 'string')
      : [];

    return {
      countriesCount: String(raw?.['countriesCount'] || ''),
      countriesLabel: String(raw?.['countriesLabel'] || ''),
      femalePercent: String(raw?.['femalePercent'] || ''),
      femaleLabel: String(raw?.['femaleLabel'] || ''),
      ageRange: String(raw?.['ageRange'] || ''),
      ageLabel: String(raw?.['ageLabel'] || ''),
      countries,
    };
  }

  private parseCollabFormats(raw: Record<string, unknown> | undefined): MediaKitPdfCollabFormats {
    const items = Array.isArray(raw?.['items'])
      ? raw['items']
          .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
          .map((i) => ({
            title: String(i['title'] || ''),
            description: String(i['description'] || ''),
          }))
          .filter((i) => i.title)
      : [];

    return {
      title: String(raw?.['title'] || ''),
      intro: String(raw?.['intro'] || ''),
      items,
    };
  }

  private parseHouseFormats(raw: Record<string, unknown> | undefined): MediaKitPdfHouseFormats {
    const items = Array.isArray(raw?.['items'])
      ? raw['items']
          .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
          .map((i) => ({ title: String(i['title'] || '') }))
          .filter((i) => i.title)
      : [];

    return {
      title: String(raw?.['title'] || ''),
      growthNote: String(raw?.['growthNote'] || ''),
      items,
    };
  }
}
