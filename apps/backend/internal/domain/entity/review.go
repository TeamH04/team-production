package entity

import "time"

type RatingDetails struct {
	Taste       *int
	Atmosphere  *int
	Service     *int
	Speed       *int
	Cleanliness *int
}

type Review struct {
	ReviewID      string
	StoreID       string
	UserID        string
	Rating        int
	RatingDetails *RatingDetails
	Content       *string
	Menus         []Menu
	Files         []File
	LikesCount    int
	LikedByMe     bool
	CreatedAt     time.Time
}
