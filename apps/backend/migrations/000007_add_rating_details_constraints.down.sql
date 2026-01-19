-- Remove CHECK constraints for rating detail columns
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS check_rating_taste;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS check_rating_atmosphere;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS check_rating_service;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS check_rating_speed;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS check_rating_cleanliness;
