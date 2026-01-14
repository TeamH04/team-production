package entity

import "time"

type Menu struct {
	MenuID      string
	StoreID     string
	Name        string
	Price       *int
	Description *string
	CreatedAt   time.Time
}
