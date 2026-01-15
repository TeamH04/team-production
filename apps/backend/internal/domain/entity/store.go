package entity

import (
	"time"
)

type Store struct {
	StoreID         string
	ThumbnailFileID *string
	ThumbnailFile   *File
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
	Category        string
	Budget          string
	AverageRating   float64
	DistanceMinutes int
	Tags            []string
	Files           []File
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Menus           []Menu
	Reviews         []Review
}
