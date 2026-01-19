-- Add CHECK constraints for rating detail columns
ALTER TABLE reviews ADD CONSTRAINT check_rating_taste
    CHECK (rating_taste IS NULL OR (rating_taste >= 1 AND rating_taste <= 5));

ALTER TABLE reviews ADD CONSTRAINT check_rating_atmosphere
    CHECK (rating_atmosphere IS NULL OR (rating_atmosphere >= 1 AND rating_atmosphere <= 5));

ALTER TABLE reviews ADD CONSTRAINT check_rating_service
    CHECK (rating_service IS NULL OR (rating_service >= 1 AND rating_service <= 5));

ALTER TABLE reviews ADD CONSTRAINT check_rating_speed
    CHECK (rating_speed IS NULL OR (rating_speed >= 1 AND rating_speed <= 5));

ALTER TABLE reviews ADD CONSTRAINT check_rating_cleanliness
    CHECK (rating_cleanliness IS NULL OR (rating_cleanliness >= 1 AND rating_cleanliness <= 5));
