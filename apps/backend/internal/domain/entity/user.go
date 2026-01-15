package entity

import "time"

// User はユーザー情報を表すエンティティ
type User struct {
	UserID     string
	Name       string
	Email      string
	IconFileID *string
	Provider   string
	IconURL    *string
	Gender     *string
	Birthday   *time.Time
	Role       string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
