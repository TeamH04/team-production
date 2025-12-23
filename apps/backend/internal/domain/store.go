package domain

import (
	"time"
)

// --- 各テーブル構造体 ---

type Store struct {
	StoreID         int64
	ThumbnailURL    string
	Name            string
	OpenedAt        *time.Time
	Description     *string
	LandscapePhotos []string
	Address         string
	PlaceID         string
	OpeningHours    *string
	Latitude        float64
	Longitude       float64
	IsApproved      bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Menus           []Menu
	Reviews         []Review
}

type Menu struct {
	MenuID      int64
	StoreID     int64
	Name        string
	Price       *int
	ImageURL    *string
	Description *string
	CreatedAt   time.Time
}

type Review struct {
	ReviewID  int64
	StoreID   int64
	UserID    string
	MenuID    int64
	Rating    int
	Content   *string
	ImageURLs []string
	PostedAt  time.Time
	CreatedAt time.Time
}
