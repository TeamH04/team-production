package domain

import "time"

// User はユーザー情報を表すエンティティ
type User struct {
	UserID    string
	Name      string
	Email     string
	IconURL   *string
	Gender    *string
	Birthday  *time.Time
	Role      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Favorite はお気に入り店舗を表すエンティティ
type Favorite struct {
	FavoriteID int64
	UserID     string
	StoreID    int64
	CreatedAt  time.Time
	Store      *Store
}

// Report は通報を表すエンティティ
type Report struct {
	ReportID   int64
	UserID     string
	TargetType string
	TargetID   int64
	Reason     string
	Status     string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Media はアップロードされたメディア情報を表すエンティティ
type Media struct {
	MediaID   int64
	UserID    string
	URL       string
	FileType  string
	FileSize  int64
	CreatedAt time.Time
}
