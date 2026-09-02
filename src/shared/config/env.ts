function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const nodeEnv = process.env['NODE_ENV'] ?? 'development';

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
  adminPasswordHash:
    process.env['ADMIN_PASSWORD_HASH'] ??
    '8deb4d72b9e5c0fe7ceb45732bfb76d4e7f7f97ac61aba1e08c5dbad944a6494',
  adminAuthSecret:
    process.env['ADMIN_AUTH_SECRET'] ??
    'a3424812423d5d14ddc1419e241d97457629acb53fad695ef99235d4720083c7',
  adminUserId: process.env['ADMIN_USER_ID'] ?? '00000000-0000-0000-0000-000000000001',
};
