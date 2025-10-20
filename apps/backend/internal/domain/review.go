package domain

import (
	"time"
)

type Review struct {
	ReviewID int64   `gorm:"column:review_id;primaryKey;autoIncrement" json:"review_id"`
	StoreID  int64   `gorm:"column:store_id" json:"store_id"`
	UserID   string  `gorm:"column:user_id;type:uuid" json:"user_id"`
	MenuID   int64   `gorm:"column:menu_id" json:"menu_id"`
	Rating   int     `gorm:"column:rating" json:"rating"`
	Content  *string `gorm:"column:content" json:"content,omitempty"`
	// image_urls omitted here for brevity
	PostedAt  time.Time `gorm:"column:posted_at" json:"posted_at"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}
