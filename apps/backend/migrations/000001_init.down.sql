-- Rollback for the initial schema. Mirror the objects created in 000001_init.up.sql.

BEGIN;

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.menus CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Example: leave extensions enabled (drop only if created specifically for this service)
-- DROP EXTENSION IF EXISTS "pgcrypto";


COMMIT;
