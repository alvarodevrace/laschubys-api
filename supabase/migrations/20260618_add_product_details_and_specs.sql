ALTER TABLE laschubys.products
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS specifications text;
