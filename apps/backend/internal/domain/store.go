package domain

import (
	"time"
)

type Store struct {
	StoreID      int64      `gorm:"column:store_id;primaryKey;autoIncrement" json:"store_id"`
	ThumbnailURL string     `gorm:"column:thumbnail_url" json:"thumbnail_url"`
	Name         string     `gorm:"column:name" json:"name"`
	OpenedAt     *time.Time `gorm:"column:opened_at" json:"opened_at,omitempty"`
	Description  *string    `gorm:"column:description" json:"description,omitempty"`
	Address      string     `gorm:"column:address" json:"address"`
	OpeningHours *string    `gorm:"column:opening_hours" json:"opening_hours,omitempty"`
	Latitude     float64    `gorm:"column:latitude" json:"latitude"`
	Longitude    float64    `gorm:"column:longitude" json:"longitude"`
	IsApproved   bool       `gorm:"column:is_approved;default:false" json:"is_approved"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at" json:"updated_at"`
}
