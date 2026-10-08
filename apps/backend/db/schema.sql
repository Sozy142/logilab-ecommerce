--
-- PostgreSQL database dump
--

\restrict mwIZD9mFTThTueNr6P1b41Fu2zPAEgCg69eaQBRJdSFPIG1abSCPJaNjQf4l6ht

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'staff',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    status text DEFAULT 'pending'::text,
    total numeric(12,2) NOT NULL,
    shipping_address text NOT NULL,
    phone text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: create_order(uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_order(p_customer_id uuid, p_shipping_address text, p_phone text, p_items jsonb) RETURNS public.orders
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_order orders;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_price numeric(12,2);
  v_stock int;
  v_total numeric(12,2) := 0;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity:%', v_variant_id;
    END IF;

    SELECT price, stock INTO v_price, v_stock
    FROM product_variants WHERE id = v_variant_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'variant_not_found:%', v_variant_id;
    END IF;
    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock:%', v_variant_id;
    END IF;

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  INSERT INTO orders (customer_id, status, total, shipping_address, phone)
  VALUES (p_customer_id, 'pending', v_total, p_shipping_address, p_phone)
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    SELECT price INTO v_price FROM product_variants WHERE id = v_variant_id;

    INSERT INTO order_items (order_id, variant_id, quantity, price)
    VALUES (v_order.id, v_variant_id, v_quantity, v_price);

    UPDATE product_variants SET stock = stock - v_quantity WHERE id = v_variant_id;
  END LOOP;

  RETURN v_order;
END;
$$;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text NOT NULL,
    content text NOT NULL,
    cover_image text NOT NULL,
    tag text NOT NULL,
    author_name text NOT NULL,
    read_minutes integer DEFAULT 5 NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    parent_id uuid,
    image_url text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    recipient_name text NOT NULL,
    phone text NOT NULL,
    address_line text NOT NULL,
    city text NOT NULL,
    is_default boolean DEFAULT false
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    full_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hero_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    headline text NOT NULL,
    subheadline text,
    cta_label text,
    cta_url text,
    image_url text,
    badge_text text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    variant_id uuid,
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    variant_name text NOT NULL,
    sku text,
    price numeric(12,2) NOT NULL,
    stock integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    category_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    specs jsonb DEFAULT '[]'::jsonb NOT NULL,
    datasheet_url text,
    library_url text,
    brand text
);


--
-- Name: product_catalog; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_catalog AS
 SELECT p.id,
    p.name,
    p.slug,
    p.description,
    p.category_id,
    p.brand,
    p.specs,
    p.datasheet_url,
    p.library_url,
    p.created_at,
    v.cheapest_price,
    COALESCE(v.total_stock, (0)::bigint) AS total_stock
   FROM (public.products p
     LEFT JOIN LATERAL ( SELECT min(pv.price) AS cheapest_price,
            sum(pv.stock) AS total_stock
           FROM public.product_variants pv
          WHERE (pv.product_id = p.id)) v ON (true));


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    image_url text NOT NULL,
    display_order integer DEFAULT 0
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL
);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: hero_banners hero_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_banners
    ADD CONSTRAINT hero_banners_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customers customers_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_id_fkey FOREIGN KEY (id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: blog_posts Public read blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT USING (true);


--
-- Name: categories Public read categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);


--
-- Name: product_images Public read images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read images" ON public.product_images FOR SELECT USING (true);


--
-- Name: products Public read products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);


--
-- Name: product_variants Public read variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT USING (true);


--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict mwIZD9mFTThTueNr6P1b41Fu2zPAEgCg69eaQBRJdSFPIG1abSCPJaNjQf4l6ht


