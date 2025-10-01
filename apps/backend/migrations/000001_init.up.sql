-- Initial schema bootstrap.
-- Replace the sample statements below with your real tables / functions.
-- This file is executed with migrate up.

BEGIN;

-- Example: enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Example table (safe to replace/delete)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    display_name TEXT NOT NULL
);

COMMIT;
