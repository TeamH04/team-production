-- Remove rating detail columns from reviews table
ALTER TABLE reviews DROP COLUMN IF EXISTS rating_taste;
ALTER TABLE reviews DROP COLUMN IF EXISTS rating_atmosphere;
ALTER TABLE reviews DROP COLUMN IF EXISTS rating_service;
ALTER TABLE reviews DROP COLUMN IF EXISTS rating_speed;
ALTER TABLE reviews DROP COLUMN IF EXISTS rating_cleanliness;
