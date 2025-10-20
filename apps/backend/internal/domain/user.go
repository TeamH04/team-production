package domain

import "time"

type User struct {
	UserID    string     `gorm:"column:user_id;primaryKey;type:uuid" json:"user_id"`
	Name      string     `gorm:"column:name" json:"name"`
	Gender    *string    `gorm:"column:gender" json:"gender,omitempty"`
	Email     string     `gorm:"column:email" json:"email"`
	Birthday  *time.Time `gorm:"column:birthday" json:"birthday,omitempty"`
	IconURL   string     `gorm:"column:icon_url" json:"icon_url"`
	Provider  string     `gorm:"column:provider" json:"provider"`
	Role      string     `gorm:"column:role" json:"role"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updated_at"`
}
