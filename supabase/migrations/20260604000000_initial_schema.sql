--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

--
-- Name: laschubys; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA laschubys;


--
-- Name: is_admin(); Type: FUNCTION; Schema: laschubys; Owner: -
--

CREATE FUNCTION laschubys.is_admin() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM laschubys.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role = 'admin', false);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: laschubys; Owner: -
--

CREATE FUNCTION laschubys.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blog_posts; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    content jsonb DEFAULT '[]'::jsonb,
    category text,
    read_time text,
    cover_image text,
    author text DEFAULT 'Mamá de Las Chubys'::text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: comments; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_slug text NOT NULL,
    user_id uuid NOT NULL,
    author_name text NOT NULL,
    body text NOT NULL,
    reported boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comments_body_check CHECK ((char_length(body) <= 2000))
);


--
-- Name: order_items; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: orders; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    total numeric NOT NULL,
    payphone_transaction_id text,
    shipping_address jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])))
);


--
-- Name: products; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.products (
    id text NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    source text NOT NULL,
    tag text,
    copy text,
    description text,
    images text[] DEFAULT '{}'::text[],
    affiliate_url text,
    shipping_note text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_source_check CHECK ((source = ANY (ARRAY['owned'::text, 'affiliate'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: laschubys; Owner: -
--

CREATE TABLE laschubys.profiles (
    id uuid NOT NULL,
    username text,
    avatar_url text,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text])))
);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: orders trg_lch_orders_updated_at; Type: TRIGGER; Schema: laschubys; Owner: -
--

CREATE TRIGGER trg_lch_orders_updated_at BEFORE UPDATE ON laschubys.orders FOR EACH ROW EXECUTE FUNCTION laschubys.update_updated_at_column();


--
-- Name: blog_posts trg_lch_posts_updated_at; Type: TRIGGER; Schema: laschubys; Owner: -
--

CREATE TRIGGER trg_lch_posts_updated_at BEFORE UPDATE ON laschubys.blog_posts FOR EACH ROW EXECUTE FUNCTION laschubys.update_updated_at_column();


--
-- Name: products trg_lch_products_updated_at; Type: TRIGGER; Schema: laschubys; Owner: -
--

CREATE TRIGGER trg_lch_products_updated_at BEFORE UPDATE ON laschubys.products FOR EACH ROW EXECUTE FUNCTION laschubys.update_updated_at_column();


--
-- Name: profiles trg_lch_profiles_updated_at; Type: TRIGGER; Schema: laschubys; Owner: -
--

CREATE TRIGGER trg_lch_profiles_updated_at BEFORE UPDATE ON laschubys.profiles FOR EACH ROW EXECUTE FUNCTION laschubys.update_updated_at_column();


--
-- Name: comments comments_post_slug_fkey; Type: FK CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.comments
    ADD CONSTRAINT comments_post_slug_fkey FOREIGN KEY (post_slug) REFERENCES laschubys.blog_posts(slug) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES laschubys.orders(id);


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES laschubys.products(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: laschubys; Owner: -
--

ALTER TABLE ONLY laschubys.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: blog_posts; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: comments lch_comments_delete; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_comments_delete ON laschubys.comments FOR DELETE USING (laschubys.is_admin());


--
-- Name: comments lch_comments_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_comments_insert ON laschubys.comments FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: comments lch_comments_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_comments_select ON laschubys.comments FOR SELECT USING (((reported = false) OR laschubys.is_admin()));


--
-- Name: comments lch_comments_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_comments_update ON laschubys.comments FOR UPDATE USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: order_items lch_items_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_items_insert ON laschubys.order_items FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: order_items lch_items_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_items_select ON laschubys.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM laschubys.orders o
  WHERE ((o.id = order_items.order_id) AND ((o.user_id = auth.uid()) OR laschubys.is_admin())))));


--
-- Name: orders lch_orders_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_orders_insert ON laschubys.orders FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: orders lch_orders_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_orders_select ON laschubys.orders FOR SELECT USING (((auth.uid() = user_id) OR laschubys.is_admin()));


--
-- Name: orders lch_orders_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_orders_update ON laschubys.orders FOR UPDATE USING (laschubys.is_admin());


--
-- Name: blog_posts lch_posts_delete; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_posts_delete ON laschubys.blog_posts FOR DELETE USING (laschubys.is_admin());


--
-- Name: blog_posts lch_posts_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_posts_insert ON laschubys.blog_posts FOR INSERT WITH CHECK (laschubys.is_admin());


--
-- Name: blog_posts lch_posts_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_posts_select ON laschubys.blog_posts FOR SELECT USING (((published_at IS NOT NULL) OR laschubys.is_admin()));


--
-- Name: blog_posts lch_posts_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_posts_update ON laschubys.blog_posts FOR UPDATE USING (laschubys.is_admin());


--
-- Name: products lch_products_delete; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_products_delete ON laschubys.products FOR DELETE USING (laschubys.is_admin());


--
-- Name: products lch_products_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_products_insert ON laschubys.products FOR INSERT WITH CHECK (laschubys.is_admin());


--
-- Name: products lch_products_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_products_select ON laschubys.products FOR SELECT USING (((active = true) OR laschubys.is_admin()));


--
-- Name: products lch_products_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_products_update ON laschubys.products FOR UPDATE USING (laschubys.is_admin());


--
-- Name: profiles lch_profiles_admin; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_profiles_admin ON laschubys.profiles USING (laschubys.is_admin());


--
-- Name: profiles lch_profiles_insert; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_profiles_insert ON laschubys.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles lch_profiles_select; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_profiles_select ON laschubys.profiles FOR SELECT USING (((auth.uid() = id) OR laschubys.is_admin()));


--
-- Name: profiles lch_profiles_update; Type: POLICY; Schema: laschubys; Owner: -
--

CREATE POLICY lch_profiles_update ON laschubys.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: order_items; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: laschubys; Owner: -
--

ALTER TABLE laschubys.profiles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

