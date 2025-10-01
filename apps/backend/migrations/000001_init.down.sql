-- Rollback for the initial schema. Mirror the objects created in 000001_init.up.sql.

BEGIN;

-- Example: drop sample table
DROP TABLE IF EXISTS public.users;

-- Example: leave extensions enabled (drop only if created specifically for this service)
-- DROP EXTENSION IF EXISTS "pgcrypto";

COMMIT;
