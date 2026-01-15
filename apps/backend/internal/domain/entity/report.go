package entity

import "time"

// Report は通報を表すエンティティ
type Report struct {
	ReportID   int64
	UserID     string
	TargetType string // "review","store"など
	TargetID   int64
	Reason     string
	Status     string // "pending", "resolved", "rejected"
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
