package input_port

import "time"

type CreateStoreInput struct {
	Name            string
	Address         string
	ThumbnailURL    string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	LandscapePhotos []string
	Latitude        float64
	Longitude       float64
}

type UpdateStoreInput struct {
	Name            *string
	Address         *string
	ThumbnailURL    *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	LandscapePhotos []string
	Latitude        *float64
	Longitude       *float64
}
