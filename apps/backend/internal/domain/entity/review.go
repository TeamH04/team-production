package entity

import "time"

type Review struct {
	ReviewID   string
	StoreID    string
	UserID     string
	Rating     int
	Content    *string
	Menus      []Menu
	Files      []File
	LikesCount int
	LikedByMe  bool
	CreatedAt  time.Time
}
