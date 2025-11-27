package domain

import "time"

// User はユーザー情報を表すエンティティ
type User struct {
	UserID    string     `gorm:"column:user_id;primaryKey;type:uuid"  json:"user_id"`
	Name      string     `gorm:"column:name"                          json:"name"`
	Email     string     `gorm:"column:email"                         json:"email"`
	IconURL   *string    `gorm:"column:icon_url"                      json:"icon_url,omitempty"`
	Gender    *string    `gorm:"column:gender"                        json:"gender,omitempty"`
	Birthday  *time.Time `gorm:"column:birthday"                      json:"birthday,omitempty"`
	Role      string     `gorm:"column:role;default:user"             json:"role"`
	CreatedAt time.Time  `gorm:"column:created_at"                    json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at"                    json:"updated_at"`
}

// Favorite はお気に入り店舗を表すエンティティ
type Favorite struct {
	FavoriteID int64     `gorm:"column:favorite_id;primaryKey;autoIncrement" json:"favorite_id"`
	UserID     string    `gorm:"column:user_id;type:uuid"                    json:"user_id"`
	StoreID    int64     `gorm:"column:store_id"                             json:"store_id"`
	CreatedAt  time.Time `gorm:"column:created_at"                           json:"created_at"`
	Store      *Store    `gorm:"foreignKey:StoreID;references:StoreID"       json:"store,omitempty"`
}

// Report は通報を表すエンティティ
type Report struct {
	ReportID   int64     `gorm:"column:report_id;primaryKey;autoIncrement"   json:"report_id"`
	UserID     string    `gorm:"column:user_id;type:uuid"                    json:"user_id"`
	TargetType string    `gorm:"column:target_type"                          json:"target_type"` //"review","store"など
	TargetID   int64     `gorm:"column:target_id"                            json:"target_id"`
	Reason     string    `gorm:"column:reason"                               json:"reason"`
	Status     string    `gorm:"column:status;default:pending"               json:"status"` // "pending", "resolved", "rejected"
	CreatedAt  time.Time `gorm:"column:created_at"                           json:"created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"                           json:"updated_at"`
}

// Media はアップロードされたメディア情報を表すエンティティ
type Media struct {
	MediaID   int64     `gorm:"column:media_id;primaryKey;autoIncrement"     json:"media_id"`
	UserID    string    `gorm:"column:user_id;type:uuid"                     json:"user_id"`
	URL       string    `gorm:"column:url"                                   json:"url"`
	FileType  string    `gorm:"column:file_type"                             json:"file_type"`
	FileSize  int64     `gorm:"column:file_size"                             json:"file_size"`
	CreatedAt time.Time `gorm:"column:created_at"                            json:"created_at"`
}
