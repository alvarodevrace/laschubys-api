function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const nodeEnv = process.env['NODE_ENV'] ?? 'development';

// PayPal: default to sandbox mode. Set PAYPAL_MODE=disabled to keep the in-memory
// MockGateway active for local dev (no real credentials required).
type PayPalMode = 'sandbox' | 'live' | 'disabled';
const paypalMode: PayPalMode = (
  ['sandbox', 'live', 'disabled'].includes((process.env['PAYPAL_MODE'] ?? 'sandbox').toLowerCase())
    ? (process.env['PAYPAL_MODE'] ?? 'sandbox').toLowerCase()
    : 'sandbox'
) as PayPalMode;

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env['PORT'] ?? 3000),
  allowedOrigins: (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:4321')
    .split(',')
    .map((o) => o.trim())
    .map((o) => o.replace(/\/+$/, ''))
    .filter(Boolean),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  sentryDsn: process.env['SENTRY_DSN'] ?? '',
  n8nWebhookUrl: process.env['N8N_WEBHOOK_URL'] ?? '',
  adminEmail: process.env['ADMIN_EMAIL'] ?? 'adminchuby@laschubys.com',
  // --- "Invítame un Churu" (Sprint 2): PayPal + notification webhook ---
  // PAYPAL_MODE: 'sandbox' | 'live' | 'disabled'. Anything other than 'disabled'
  // requires PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (and PAYPAL_WEBHOOK_ID for webhooks).
  paypalMode,
  paypalBaseUrl:
    paypalMode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
  paypalClientId: process.env['PAYPAL_CLIENT_ID'] ?? '',
  paypalClientSecret: process.env['PAYPAL_CLIENT_SECRET'] ?? '',
  paypalWebhookId: process.env['PAYPAL_WEBHOOK_ID'] ?? '',
  donationsReturnUrl:
    process.env['DONATIONS_RETURN_URL'] ?? 'https://invitame.laschubys.com/gracias',
  donationsCancelUrl: process.env['DONATIONS_CANCEL_URL'] ?? 'https://invitame.laschubys.com/',
  donationsN8nWebhookUrl:
    process.env['DONATIONS_N8N_WEBHOOK_URL'] ??
    'https://n8n.alvarodevrace.tech/webhook/lch-donation-notify',
  // Admin auth (required): values live in Dokploy env + Bitwarden
  // (`bitwarden:global/admin-auth-secrets`). Never hardcode fallbacks here —
  // this repo is public.
  adminPasswordHash: required('ADMIN_PASSWORD_HASH'),
  adminAuthSecret: required('ADMIN_AUTH_SECRET'),
  adminUserId: process.env['ADMIN_USER_ID'] ?? '00000000-0000-0000-0000-000000000001',
};
