package domain

import "time"

type Menu struct {
	MenuID      int64     `gorm:"column:menu_id;primaryKey;autoIncrement" json:"menu_id"`
	StoreID     int64     `gorm:"column:store_id" json:"store_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Price       *int      `gorm:"column:price" json:"price,omitempty"`
	ImageURL    *string   `gorm:"column:image_url" json:"image_url,omitempty"`
	Description *string   `gorm:"column:description" json:"description,omitempty"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
}
