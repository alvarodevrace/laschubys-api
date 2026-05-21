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
};
