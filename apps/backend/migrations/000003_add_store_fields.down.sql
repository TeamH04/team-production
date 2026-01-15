BEGIN;

DROP INDEX IF EXISTS public.store_tags_store_id_idx;

DROP TABLE IF EXISTS public.store_tags;

ALTER TABLE public.stores
    DROP CONSTRAINT IF EXISTS stores_budget_check;

ALTER TABLE public.stores
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS budget,
    DROP COLUMN IF EXISTS average_rating,
    DROP COLUMN IF EXISTS distance_minutes;

COMMIT;
