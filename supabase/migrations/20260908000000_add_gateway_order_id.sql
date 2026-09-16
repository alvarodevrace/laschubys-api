ALTER TABLE laschubys.donations ADD COLUMN gateway_order_id text;
CREATE INDEX idx_donations_gateway_order_id ON laschubys.donations(gateway_order_id) WHERE gateway_order_id IS NOT NULL;
