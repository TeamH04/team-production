package domain

import (
	"time"
)

// --- 各テーブル構造体 ---

type Store struct {
	StoreID         int64      `gorm:"column:store_id;primaryKey;autoIncrement" json:"store_id"`
	ThumbnailURL    string     `gorm:"column:thumbnail_url" json:"thumbnail_url"`
	Name            string     `gorm:"column:name" json:"name"`
	OpenedAt        *time.Time `gorm:"column:opened_at" json:"opened_at,omitempty"`
	Description     *string    `gorm:"column:description" json:"description,omitempty"`
	LandscapePhotos []string   `gorm:"type:text[];column:landscape_photos" json:"landscape_photos,omitempty"`
	Address         string     `gorm:"column:address" json:"address"`
	OpeningHours    *string    `gorm:"column:opening_hours" json:"opening_hours,omitempty"`
	Latitude        float64    `gorm:"column:latitude" json:"latitude"`
	Longitude       float64    `gorm:"column:longitude" json:"longitude"`
	IsApproved      bool       `gorm:"column:is_approved;default:false" json:"is_approved"`
	CreatedAt       time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at" json:"updated_at"`
	Menus           []Menu     `gorm:"foreignKey:StoreID;references:StoreID" json:"menus,omitempty"`
	Reviews         []Review   `gorm:"foreignKey:StoreID;references:StoreID" json:"reviews,omitempty"`
}

type Menu struct {
	MenuID      int64     `gorm:"column:menu_id;primaryKey;autoIncrement" json:"menu_id"`
	StoreID     int64     `gorm:"column:store_id" json:"store_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Price       *int      `gorm:"column:price" json:"price,omitempty"`
	ImageURL    []string  `gorm:"column:image_url" json:"image_url,omitempty"`
	Description *string   `gorm:"column:description" json:"description,omitempty"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
}

type Review struct {
	ReviewID  int64     `gorm:"column:review_id;primaryKey;autoIncrement"    json:"review_id"`
	StoreID   int64     `gorm:"column:store_id"                              json:"store_id"`
	UserID    string    `gorm:"column:user_id;type:uuid"                     json:"user_id"`
	MenuID    int64     `gorm:"column:menu_id"                               json:"menu_id"`
	Rating    int       `gorm:"column:rating"                                json:"rating"`
	Content   *string   `gorm:"column:content"                               json:"content,omitempty"`
	ImageURLs []string  `gorm:"type:text[];column:image_urls"                json:"image_urls,omitempty"`
	PostedAt  time.Time `gorm:"column:posted_at"                             json:"posted_at"`
	CreatedAt time.Time `gorm:"column:created_at"                            json:"created_at"`
}
