package entity

import "time"

// Favorite はお気に入り店舗を表すエンティティ
type Favorite struct {
	UserID    string
	StoreID   string
	CreatedAt time.Time
	Store     *Store
}
