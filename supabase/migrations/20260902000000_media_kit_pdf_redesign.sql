-- Migration: media kit redesign to match PDF (data structure + seed)
-- Date: 2026-09-02
-- Project: Las Chubys
-- Context: Replicar la estructura/orden del PDF "media-kit-las-chubys-general.pdf"
--          con datos fijos aprobados por Álvaro. Estrategia ADITIVA:
--          se agregan claves nuevas (cover, metrics, collab_formats, house_formats)
--          y se actualizan las existentes que cambian (audience, contact).
--          Las claves viejas (social_metrics, content_pillars, services) se conservan
--          por compatibilidad; se limpiarán en una migración posterior.

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

-- ---------------------------------------------------------------------------
-- Seed / upsert de la nueva estructura (datos fijos del PDF, aprobados)
-- ---------------------------------------------------------------------------

-- cover: portada "Reality show felino"
INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('cover', '{
        "title": "Reality show felino",
        "subtitle": "Protagonizado por Iris Lourdes y Rubí Lucrecia, dos gatitas de personalidades opuestas que convierten lo cotidiano en drama épico.",
        "photos": [
            { "name": "Rubí", "image": "/images/cats/rubi.jpeg" },
            { "name": "Iris", "image": "/images/cats/iris.jpeg" }
        ]
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- metrics: Métricas a Julio 2026, 3 redes (Instagram / Facebook / TikTok)
INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('metrics', '{
        "asOf": "Julio 2026",
        "networks": [
            {
                "name": "Instagram",
                "handle": "@laschubys",
                "followers": "31.3k",
                "engagement": "21%",
                "reachMonthly": "963K",
                "viewsMonthly": "1.8M",
                "href": "https://www.instagram.com/laschubys/"
            },
            {
                "name": "Facebook",
                "handle": "Las Chubys",
                "followers": "3.8K",
                "engagement": "9.9%",
                "reachMonthly": "203.8K",
                "viewsMonthly": "338.5K",
                "href": "https://www.facebook.com/people/Las-Chubys/61589964727281/"
            },
            {
                "name": "TikTok",
                "handle": "@laschubys.oficial",
                "followers": "23K",
                "engagement": "12.9%",
                "reachMonthly": "35.5K",
                "viewsMonthly": "1.1M",
                "href": "https://www.tiktok.com/@laschubys.oficial"
            }
        ]
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- audience: reemplaza la existente con los datos del PDF
INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('audience', '{
        "countriesCount": "+10",
        "countriesLabel": "Países hispanohablantes",
        "femalePercent": "66%",
        "femaleLabel": "Público femenino",
        "ageRange": "25-44",
        "ageLabel": "años",
        "countries": ["México", "Argentina", "Chile", "Colombia", "España", "Perú", "Ecuador"]
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- collab_formats: Formatos de colaboración (6)
INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('collab_formats', '{
        "title": "Formatos de colaboración",
        "intro": "Cada colaboración es única y los valores varían según el alcance, derechos y formatos incluidos. Cuéntanos qué necesita tu marca y encontramos la mejor forma de integrarlo al universo Chuby.",
        "items": [
            {
                "title": "Gifting (Regalo)",
                "description": "La marca envía su producto para ser usado por Iris Lourdes o Rubí Lucrecia en contenido orgánico dentro del universo Chuby."
            },
            {
                "title": "Historias mencionando marca",
                "description": "Pack mínimo de 3 historias con mención, etiqueta y/o link directo a la marca."
            },
            {
                "title": "Reel/TikTok Patrocinado",
                "description": "Video dedicado, protagonizado por las gatas con integración natural del producto dentro de una de las series de La Casa Chuby."
            },
            {
                "title": "UGC",
                "description": "Contenido grabado por Las Chubys para uso exclusivo de la marca en sus propias redes, web o anuncios pagados (sin publicación en la cuenta de Las Chubys)."
            },
            {
                "title": "Embajador mensual",
                "description": "Campaña completa mensual que incluye reels, historias y presencia continua de la marca dentro del universo Chuby."
            },
            {
                "title": "Afiliados",
                "description": "La marca asigna un código o link exclusivo de Las Chubys. Se genera comisión por cada venta referida."
            }
        ]
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- house_formats: Formatos de La Casa Chuby (6) + nota de crecimiento
INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('house_formats', '{
        "title": "Formatos de La Casa Chuby",
        "growthNote": "100% crecimiento orgánico",
        "items": [
            { "title": "Método MIAU" },
            { "title": "Noticias de última hora" },
            { "title": "Expedientes Chuby" },
            { "title": "Recursos felinos" },
            { "title": "Carrusel" },
            { "title": "Historias" }
        ]
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- contact: reemplaza la existente con los datos del PDF
INSERT INTO laschubys.media_kit_config (key, data) VALUES
    ('contact', '{
        "website": "www.laschubys.com",
        "phone": "+593 99 213 1011",
        "email": "laschubys.oficial@gmail.com",
        "location": "Ecuador para audiencia LATAM"
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
