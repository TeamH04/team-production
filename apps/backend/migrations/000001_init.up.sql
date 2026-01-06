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
    user_id UUID PRIMARY KEY, -- Supabase Auth と揃える
    name TEXT NOT NULL,
    gender TEXT,
    birthday DATE,
    email TEXT UNIQUE NOT NULL,
    icon_url TEXT,  -- Googleアカウントのアイコンなど外部用のURL
    icon_file_id UUID,    -- このアプリ内でアップロードされた画像
    provider TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Files
-- =========================
CREATE TABLE IF NOT EXISTS public.files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_kind TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    object_key TEXT NOT NULL,
    content_type TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NULL
);
CREATE UNIQUE INDEX files_object_key_uq ON public.files(object_key);

ALTER TABLE public.files
    ADD CONSTRAINT files_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE public.users
    ADD CONSTRAINT users_icon_file_id_fkey
    FOREIGN KEY (icon_file_id) REFERENCES public.files(file_id) ON DELETE SET NULL;

-- =========================
-- Stores
-- =========================
CREATE TABLE IF NOT EXISTS public.stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thumbnail_file_id UUID REFERENCES public.files(file_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    opened_at DATE,
    description TEXT,
    address TEXT,
    opening_hours TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_map_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Favorites
-- =========================
CREATE TABLE IF NOT EXISTS public.favorites (
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, store_id)
);
CREATE INDEX favorites_store_id_idx ON public.favorites(store_id);

-- =========================
-- Menus
-- =========================
CREATE TABLE IF NOT EXISTS public.menus (
    menu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Reviews
-- =========================
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Store and review relations to files/menus
-- =========================
CREATE TABLE IF NOT EXISTS public.store_files (
    store_id UUID NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(file_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (store_id, file_id)
);
CREATE INDEX store_files_file_id_idx ON public.store_files(file_id);

CREATE TABLE IF NOT EXISTS public.review_menus (
    review_id UUID NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES public.menus(menu_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (review_id, menu_id)
);
CREATE INDEX review_menus_menu_id_idx ON public.review_menus(menu_id);

CREATE TABLE IF NOT EXISTS public.review_files (
    review_id UUID NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(file_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (review_id, file_id)
);

CREATE INDEX review_files_file_id_idx ON public.review_files(file_id);

CREATE TABLE IF NOT EXISTS public.review_likes (
    review_id UUID NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (review_id, user_id)
);

CREATE INDEX review_likes_user_id_idx ON public.review_likes(user_id);

COMMIT;
