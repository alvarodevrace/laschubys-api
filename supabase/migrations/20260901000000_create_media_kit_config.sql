-- Migration: create media_kit_config table for admin-editable Media Kit values
-- Date: 2026-09-01
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
-- Name: media_kit_config; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.media_kit_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_kit_config_key_check CHECK ((char_length(key) > 0))
);

--
-- Name: media_kit_config media_kit_config_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.media_kit_config
    ADD CONSTRAINT media_kit_config_pkey PRIMARY KEY (id);

--
-- Name: media_kit_config media_kit_config_key_key; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.media_kit_config
    ADD CONSTRAINT media_kit_config_key_key UNIQUE (key);

--
-- Name: trg_lch_media_kit_config_updated_at; Type: TRIGGER; Schema: laschubys; Owner: -
--

CREATE TRIGGER trg_lch_media_kit_config_updated_at BEFORE UPDATE ON laschubys.media_kit_config FOR EACH ROW EXECUTE FUNCTION laschubys.update_updated_at_column();

--
-- Name: media_kit_config; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.media_kit_config ENABLE ROW LEVEL SECURITY;

--
-- Name: media_kit_config lch_media_kit_config_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_media_kit_config_select ON laschubys.media_kit_config FOR SELECT USING (true);

--
-- Name: media_kit_config lch_media_kit_config_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_media_kit_config_insert ON laschubys.media_kit_config FOR INSERT WITH CHECK (laschubys.is_admin());

--
-- Name: media_kit_config lch_media_kit_config_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_media_kit_config_update ON laschubys.media_kit_config FOR UPDATE USING (laschubys.is_admin()) WITH CHECK (laschubys.is_admin());

--
-- Name: media_kit_config lch_media_kit_config_delete; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_media_kit_config_delete ON laschubys.media_kit_config FOR DELETE USING (laschubys.is_admin());

--
-- Grants required for PostgREST / supabase-js
--

GRANT ALL ON TABLE laschubys.media_kit_config TO service_role;
GRANT SELECT ON TABLE laschubys.media_kit_config TO anon;
GRANT SELECT ON TABLE laschubys.media_kit_config TO authenticated;

--
-- Seed: default Media Kit values matching current landing (2026-09-01)
-- Brenda can edit these from /admin/media-kit.
--

INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('social_metrics', '{"items":[{"platform":"instagram","account":"@laschubys","metric":"17K","label":"seguidores","href":"https://www.instagram.com/laschubys/","engagement":"4-7%"},{"platform":"tiktok","account":"@laschubys.oficial","metric":"14.4K","label":"seguidores · 609K likes","href":"https://www.tiktok.com/@laschubys.oficial","engagement":"4-7%"},{"platform":"facebook","account":"Las Chubys","metric":"2.6K","label":"seguidores","href":"https://www.facebook.com/people/Las-Chubys/61589964727281/","engagement":"4-7%"},{"platform":"engagement","account":"promedio","metric":"4-7%","label":"engagement orgánico","href":"https://www.instagram.com/laschubys/"}]}'::jsonb),
    ('audience', '{"female":"91%","male":"9%","topCountries":[{"country":"Ecuador","percentage":"60%"},{"country":"Estados Unidos","percentage":"15%"},{"country":"México","percentage":"10%"},{"country":"Colombia","percentage":"8%"},{"country":"Otros","percentage":"7%"}],"topCities":[{"city":"Guayaquil","percentage":"35%"},{"city":"Quito","percentage":"22%"},{"city":"Cuenca","percentage":"8%"}]}'::jsonb),
    ('content_pillars', '{"items":["Reviews honestos","Comparativas","Tutoriales","Lifestyle","Unboxing","Recomendaciones"]}'::jsonb),
    ('services', '{"items":[{"title":"Publicidad","description":"Integración natural de productos en contenido orgánico."},{"title":"Reseñas","description":"Opinión real y detallada dirigida a una comunidad de compradores."},{"title":"Colaboraciones","description":"Campañas creativas a medida con la esencia de Las Chubys."}]}'::jsonb),
    ('contact', '{"email":"hola@laschubys.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
