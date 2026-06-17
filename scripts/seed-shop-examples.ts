import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Seed aborted.');
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'laschubys' },
});

interface SeedProduct {
  id: string;
  name: string;
  price: number;
  source: 'owned' | 'affiliate';
  product_type: 'physical' | 'link';
  category_id: null;
  tag: string;
  copy: string;
  description: string;
  details: string;
  specifications: string;
  images: string[];
  affiliate_url?: string;
  active: boolean;
}

const products: SeedProduct[] = [
  {
    id: randomUUID(),
    name: 'Rascador Premium Michi',
    price: 45.99,
    source: 'owned',
    product_type: 'physical',
    category_id: null,
    tag: 'Para michis',
    copy: 'Rascador robusto para que tu gato afilen sus uñas sin dañar muebles.',
    description: 'Rascador de sisal natural con base estable y poste alto.',
    details:
      'Incluye base antideslizante, poste de 80 cm de alto y pelota colgante. Ideal para gatos adultos y cachorros.',
    specifications: 'Material: sisal y MDF\nPeso: 3.2 kg\nDimensiones: 40 x 40 x 80 cm',
    images: ['https://placehold.co/600x600/orange/white?text=Rascador'],
    active: true,
  },
  {
    id: randomUUID(),
    name: 'Taza Michi Lover',
    price: 18.5,
    source: 'owned',
    product_type: 'physical',
    category_id: null,
    tag: 'Para humanos',
    copy: 'Taza cerámica con diseño de gatitos para los amantes de los michis.',
    description: 'Taza de 11 oz con acabado mate y diseño exclusivo Las Chubys.',
    details: 'Perfecta para café, té o chocolate. Resistente a microondas y lavavajillas.',
    specifications: 'Capacidad: 11 oz\nMaterial: cerámica\nAcabado: mate',
    images: ['https://placehold.co/600x600/orange/white?text=Taza'],
    active: true,
  },
  {
    id: randomUUID(),
    name: 'Arena Aglomerante Recomendada',
    price: 24.99,
    source: 'affiliate',
    product_type: 'link',
    category_id: null,
    tag: 'Afiliado',
    copy: 'Arena de alta absorción con activación al contacto con líquidos.',
    description: 'Compra esta arena recomendada por Las Chubys en nuestra tienda afiliada.',
    details: 'Enlace afiliado a producto seleccionado por el equipo de Las Chubys.',
    specifications: 'Tipo: aglomerante\nPeso: 10 kg\nEnvío: tienda externa',
    images: ['https://placehold.co/600x600/orange/white?text=Arena'],
    affiliate_url: 'https://www.amazon.com/dp/example',
    active: true,
  },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function seed(): Promise<void> {
  for (const product of products) {
    const slug = toSlug(product.name);

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`Skipping existing: ${slug}`);
      continue;
    }

    const { error } = await supabase.from('products').insert({ ...product, slug });
    if (error) {
      console.error(`Error inserting ${slug}:`, error);
    } else {
      console.log(`Inserted: ${slug}`);
    }
  }
}

seed().then(() => process.exit(0));
