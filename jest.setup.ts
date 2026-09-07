process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'test-anon-key';

// Admin auth (required since the 2026-09-07 security fix removed hardcoded
// fallbacks from env.ts). Test-only dummies — real values live in Dokploy env.
process.env.ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? 'test-admin-password-hash';
process.env.ADMIN_AUTH_SECRET = process.env.ADMIN_AUTH_SECRET ?? 'test-admin-auth-secret';
