BEGIN;

ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'カフェ・喫茶',
    ADD COLUMN IF NOT EXISTS budget TEXT DEFAULT '$$',
    ADD COLUMN IF NOT EXISTS average_rating DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS distance_minutes INT DEFAULT 5;

ALTER TABLE public.stores
    ADD CONSTRAINT stores_budget_check CHECK (budget IN ('$', '$$', '$$$'));

CREATE TABLE IF NOT EXISTS public.store_tags (
    store_id UUID NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (store_id, tag)
);

CREATE INDEX IF NOT EXISTS store_tags_store_id_idx ON public.store_tags(store_id);

COMMIT;
