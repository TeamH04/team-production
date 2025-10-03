-- Initial schema bootstrap.
-- Replace the sample statements below with your real tables / functions.
-- This file is executed with migrate up.

BEGIN;

-- Example: enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Users
-- =========================
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Supabase Auth と揃える
    name TEXT NOT NULL,
    gender TEXT,
    birthday DATE,
    email TEXT UNIQUE NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Stores
-- =========================
CREATE TABLE IF NOT EXISTS public.stores (
    store_id BIGSERIAL PRIMARY KEY,
    thumbnail_url TEXT,
    name TEXT NOT NULL,
    opened_at DATE,
    description TEXT,
    landscape_photos TEXT[],
    address TEXT,
    opening_hours TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Favorites
-- =========================
CREATE TABLE IF NOT EXISTS public.favorites (
    favorite_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, store_id)
);

-- =========================
-- Reviews
-- =========================
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    menu_id BIGINT NOT NULL REFERENCES public.menus(menu_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    image_urls TEXT[],
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Menus
-- =========================
CREATE TABLE IF NOT EXISTS public.menus (
    menu_id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);



COMMIT;
