package entity

import (
	"time"
)

type Store struct {
	StoreID         string
	ThumbnailFileID *string
	Name            string
	OpenedAt        *time.Time
	Description     *string
	Address         string
	PlaceID         string
	OpeningHours    *string
	Latitude        float64
	Longitude       float64
	GoogleMapURL    *string
	IsApproved      bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Menus           []Menu
	Reviews         []Review
}
