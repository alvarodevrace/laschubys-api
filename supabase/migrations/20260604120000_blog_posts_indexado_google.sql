-- Add Google Indexing API tracking columns to blog_posts
ALTER TABLE laschubys.blog_posts
  ADD COLUMN IF NOT EXISTS indexado_google boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS indexado_google_at timestamptz;
