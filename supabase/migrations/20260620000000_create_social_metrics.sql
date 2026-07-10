-- Migration: create social_metrics table for Meta + TikTok insights
-- Date: 2026-06-20
-- Project: Las Chubys

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
-- Name: social_metrics; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.social_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    account_id text NOT NULL,
    metric_type text NOT NULL,
    value_numeric numeric,
    value_text text,
    period text,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    external_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: social_metrics social_metrics_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.social_metrics
    ADD CONSTRAINT social_metrics_pkey PRIMARY KEY (id);

--
-- Name: idx_social_metrics_platform_metric_recorded; Type: INDEX; Schema: laschubys; Owner: -
--

CREATE INDEX idx_social_metrics_platform_metric_recorded ON laschubys.social_metrics USING btree (platform, metric_type, recorded_at DESC);

--
-- Name: idx_social_metrics_platform_account_recorded; Type: INDEX; Schema: laschubys; Owner: -
--

CREATE INDEX idx_social_metrics_platform_account_recorded ON laschubys.social_metrics USING btree (platform, account_id, recorded_at DESC);

--
-- Name: social_metrics; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.social_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: social_metrics lch_social_metrics_delete; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_social_metrics_delete ON laschubys.social_metrics FOR DELETE USING ((auth.role() = 'service_role'::text));

--
-- Name: social_metrics lch_social_metrics_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_social_metrics_insert ON laschubys.social_metrics FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));

--
-- Name: social_metrics lch_social_metrics_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_social_metrics_select ON laschubys.social_metrics FOR SELECT USING (true);

--
-- Name: social_metrics lch_social_metrics_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_social_metrics_update ON laschubys.social_metrics FOR UPDATE USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));

--
-- Grants required for PostgREST / supabase-js
--

GRANT ALL ON TABLE laschubys.social_metrics TO service_role;
GRANT SELECT ON TABLE laschubys.social_metrics TO anon;
GRANT SELECT ON TABLE laschubys.social_metrics TO authenticated;

--
-- Seed: fallback manual metrics matching current Media Kit (2026-06-20)
-- These values keep the Media Kit working while Meta/TikTok apps are reviewed.
--

INSERT INTO laschubys.social_metrics (platform, account_id, metric_type, value_numeric, value_text, period, recorded_at, external_id, metadata) VALUES
    ('instagram', 'laschubys', 'followers', 17000, '17K', 'lifetime', now(), NULL, '{"source":"manual","label":"seguidores","engagement":"4-7%","href":"https://www.instagram.com/laschubys/"}'::jsonb),
    ('tiktok', 'laschubys.oficial', 'followers', 14400, '14.4K', 'lifetime', now(), NULL, '{"source":"manual","label":"seguidores · 609K likes","engagement":"4-7%","href":"https://www.tiktok.com/@laschubys.oficial"}'::jsonb),
    ('facebook', 'Las Chubys', 'followers', 2600, '2.6K', 'lifetime', now(), NULL, '{"source":"manual","label":"seguidores","engagement":"4-7%","href":"https://www.facebook.com/people/Las-Chubys/61589964727281/"}'::jsonb),
    ('engagement', 'promedio', 'engagement', NULL, '4-7%', 'monthly', now(), NULL, '{"source":"manual","label":"engagement orgánico","href":"https://www.instagram.com/laschubys/"}'::jsonb);
