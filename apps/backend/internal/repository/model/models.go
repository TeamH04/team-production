package model

import "time"

type Store struct {
	StoreID         string         `gorm:"column:store_id;primaryKey;type:uuid;default:gen_random_uuid()"`
	ThumbnailFileID *string        `gorm:"column:thumbnail_file_id;type:uuid"`
	Name            string         `gorm:"column:name"`
	OpenedAt        *time.Time     `gorm:"column:opened_at"`
	Description     *string        `gorm:"column:description"`
	Address         string         `gorm:"column:address"`
	OpeningHours    *string        `gorm:"column:opening_hours"`
	Latitude        float64        `gorm:"column:latitude"`
	Longitude       float64        `gorm:"column:longitude"`
	GoogleMapURL    *string        `gorm:"column:google_map_url"`
	PlaceID         string         `gorm:"column:place_id"`
	IsApproved      bool           `gorm:"column:is_approved;default:false"`
	CreatedAt       time.Time      `gorm:"column:created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at"`
	Menus           []Menu         `gorm:"foreignKey:StoreID;references:StoreID"`
	Reviews         []Review       `gorm:"foreignKey:StoreID;references:StoreID"`
	ThumbnailFile   *File          `gorm:"foreignKey:ThumbnailFileID;references:FileID"`
}

type Menu struct {
	MenuID      string    `gorm:"column:menu_id;primaryKey;type:uuid;default:gen_random_uuid()"`
	StoreID     string    `gorm:"column:store_id;type:uuid"`
	Name        string    `gorm:"column:name"`
	Price       *int      `gorm:"column:price"`
	Description *string   `gorm:"column:description"`
	CreatedAt   time.Time `gorm:"column:created_at"`
}

type Review struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey;type:uuid;default:gen_random_uuid()"`
	StoreID   string    `gorm:"column:store_id;type:uuid"`
	UserID    string    `gorm:"column:user_id;type:uuid"`
	Rating    int       `gorm:"column:rating"`
	Content   *string   `gorm:"column:content"`
	CreatedAt time.Time `gorm:"column:created_at"`
	Menus     []Menu    `gorm:"many2many:review_menus;joinForeignKey:ReviewID;joinReferences:MenuID"`
	Files     []File    `gorm:"many2many:review_files;joinForeignKey:ReviewID;joinReferences:FileID"`
}

type File struct {
	FileID      string    `gorm:"column:file_id;primaryKey;type:uuid;default:gen_random_uuid()"`
	FileKind    string    `gorm:"column:file_kind"`
	FileName    string    `gorm:"column:file_name"`
	FileSize    *int64    `gorm:"column:file_size"`
	ObjectKey   string    `gorm:"column:object_key"`
	ContentType *string   `gorm:"column:content_type"`
	IsDeleted   bool      `gorm:"column:is_deleted"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	CreatedBy   *string   `gorm:"column:created_by;type:uuid"`
}

type StoreFile struct {
	StoreID   string    `gorm:"column:store_id;primaryKey;type:uuid"`
	FileID    string    `gorm:"column:file_id;primaryKey;type:uuid"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (StoreFile) TableName() string { return "store_files" }

type ReviewMenu struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey;type:uuid"`
	MenuID    string    `gorm:"column:menu_id;primaryKey;type:uuid"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (ReviewMenu) TableName() string { return "review_menus" }

type ReviewFile struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey;type:uuid"`
	FileID    string    `gorm:"column:file_id;primaryKey;type:uuid"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (ReviewFile) TableName() string { return "review_files" }

type User struct {
	UserID     string     `gorm:"column:user_id;primaryKey;type:uuid"`
	Name       string     `gorm:"column:name"`
	Email      string     `gorm:"column:email"`
	IconURL    *string    `gorm:"column:icon_url"`
	IconFileID *string    `gorm:"column:icon_file_id;type:uuid"`
	Provider   string     `gorm:"column:provider"`
	Gender     *string    `gorm:"column:gender"`
	Birthday   *time.Time `gorm:"column:birthday"`
	Role       string     `gorm:"column:role;default:user"`
	CreatedAt  time.Time  `gorm:"column:created_at"`
	UpdatedAt  time.Time  `gorm:"column:updated_at"`
}

type Favorite struct {
	UserID    string    `gorm:"column:user_id;primaryKey;type:uuid"`
	StoreID   string    `gorm:"column:store_id;primaryKey;type:uuid"`
	CreatedAt time.Time `gorm:"column:created_at"`
	Store     *Store    `gorm:"foreignKey:StoreID;references:StoreID"`
}

type Report struct {
	ReportID   int64     `gorm:"column:report_id;primaryKey;autoIncrement"`
	UserID     string    `gorm:"column:user_id;type:uuid"`
	TargetType string    `gorm:"column:target_type"`
	TargetID   int64     `gorm:"column:target_id"`
	Reason     string    `gorm:"column:reason"`
	Status     string    `gorm:"column:status;default:pending"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"`
}

type ReviewLike struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey;type:uuid"`
	UserID    string    `gorm:"column:user_id;primaryKey;type:uuid"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (ReviewLike) TableName() string { return "review_likes" }
