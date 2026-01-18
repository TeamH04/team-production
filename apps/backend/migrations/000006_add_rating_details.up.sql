-- Add rating detail columns to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_taste INT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_atmosphere INT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_service INT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_speed INT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_cleanliness INT;
