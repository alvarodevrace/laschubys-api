-- Migration: create donations table for "Invítame un Churu" feature
-- Date: 2026-09-07
-- Project: Las Chubys
-- Plan: vault/laschubys/20-Tech/PLAN-INVITAME.md
--
-- ============================================================================
-- PROTOCOL RX (regla workspace: obligatorio antes de DDL/RLS)
-- ============================================================================
-- DISEÑO: Tabla laschubys.donations registra cada colaboración de la página
--   invitame.laschubys.com. El BFF (service_role) escribe; el público solo lee
--   filas 'approved' (muro moderado UGC). gateway_ref UNIQUE garantiza
--   idempotencia de webhooks de pago. CHECKs de tier/status/montos como
--   defensa en profundidad junto a los DTOs del BFF.
-- PRE-MORTEM:
--   1) RLS mal configurada filtra mensajes privados al muro → mitigación:
--      única policy SELECT con USING (status = 'approved'), sin policies de
--      escritura para anon/authenticated (negado por defecto) + test de contrato.
--   2) Webhook duplicado sin UNIQUE en gateway_ref duplicaría colaboraciones
--      → mitigación: UNIQUE gateway_ref + upsert ON CONFLICT DO NOTHING en repo.
--   3) Backend con bug inserta tier/status inválidos → mitigación: CHECK
--      constraints en DB + validación class-validator en BFF (doble capa).
-- CONTRATO (cómo verificamos éxito tras ejecutar):
--   a) \d+ laschubys.donations muestra tabla, PK, UNIQUE y CHECKs.
--   b) SET ROLE anon: SELECT ve solo 'approved' (count correcto).
--   c) SET ROLE anon: INSERT → permission denied.
--   d) Duplicar gateway_ref como service_role → unique violation.
--   e) Filas de prueba eliminadas al final (no dejar basura).
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: donations; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tier text NOT NULL,
    amount_usd numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    donor_name text,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    gateway text DEFAULT 'paypal'::text NOT NULL,
    gateway_ref text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT donations_tier_check CHECK ((tier = ANY (ARRAY['croqueta'::text, 'churu'::text, 'salmon'::text]))),
    CONSTRAINT donations_amount_check CHECK ((amount_usd > (0)::numeric)),
    CONSTRAINT donations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT donations_donor_name_check CHECK ((donor_name IS NULL OR char_length(donor_name) <= 60)),
    CONSTRAINT donations_message_check CHECK ((message IS NULL OR char_length(message) <= 500))
);

--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);

--
-- Name: donations donations_gateway_ref_key; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.donations
    ADD CONSTRAINT donations_gateway_ref_key UNIQUE (gateway_ref);

--
-- Name: idx_donations_public_wall; Type: INDEX; Schema: laschubys; Owner: -
--

CREATE INDEX idx_donations_public_wall ON laschubys.donations USING btree (created_at DESC) WHERE (status = 'approved'::text);

--
-- Name: trg_lch_donations_updated_at; Type: TRIGGER; Schema: laschubys; Owner: -
--

CREATE TRIGGER trg_lch_donations_updated_at BEFORE UPDATE ON laschubys.donations FOR EACH ROW EXECUTE FUNCTION laschubys.update_updated_at_column();

--
-- Name: donations; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.donations ENABLE ROW LEVEL SECURITY;

--
-- Name: donations lch_donations_select; Type: POLICY; Schema: laschubys; Owner: -
-- Público solo ve colaboraciones aprobadas (muro moderado).
-- Sin policies INSERT/UPDATE/DELETE para anon/authenticated: escritura
-- exclusiva vía service_role desde el BFF.
--

CREATE POLICY lch_donations_select ON laschubys.donations FOR SELECT TO anon, authenticated USING ((status = 'approved'::text));

--
-- Grants required for PostgREST / supabase-js
--

GRANT ALL ON TABLE laschubys.donations TO service_role;
GRANT SELECT ON TABLE laschubys.donations TO anon;
GRANT SELECT ON TABLE laschubys.donations TO authenticated;
