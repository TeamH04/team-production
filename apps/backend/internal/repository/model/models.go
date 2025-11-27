package model

import (
	"time"

	"github.com/lib/pq"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

type Store struct {
	StoreID         int64          `gorm:"column:store_id;primaryKey;autoIncrement"`
	ThumbnailURL    string         `gorm:"column:thumbnail_url"`
	Name            string         `gorm:"column:name"`
	OpenedAt        *time.Time     `gorm:"column:opened_at"`
	Description     *string        `gorm:"column:description"`
	LandscapePhotos pq.StringArray `gorm:"type:text[];column:landscape_photos"`
	Address         string         `gorm:"column:address"`
	OpeningHours    *string        `gorm:"column:opening_hours"`
	Latitude        float64        `gorm:"column:latitude"`
	Longitude       float64        `gorm:"column:longitude"`
	IsApproved      bool           `gorm:"column:is_approved;default:false"`
	CreatedAt       time.Time      `gorm:"column:created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at"`
	Menus           []Menu         `gorm:"foreignKey:StoreID;references:StoreID"`
	Reviews         []Review       `gorm:"foreignKey:StoreID;references:StoreID"`
}

type Menu struct {
	MenuID      int64     `gorm:"column:menu_id;primaryKey;autoIncrement"`
	StoreID     int64     `gorm:"column:store_id"`
	Name        string    `gorm:"column:name"`
	Price       *int      `gorm:"column:price"`
	ImageURL    *string   `gorm:"column:image_url"`
	Description *string   `gorm:"column:description"`
	CreatedAt   time.Time `gorm:"column:created_at"`
}

type Review struct {
	ReviewID  int64          `gorm:"column:review_id;primaryKey;autoIncrement"`
	StoreID   int64          `gorm:"column:store_id"`
	UserID    string         `gorm:"column:user_id;type:uuid"`
	MenuID    int64          `gorm:"column:menu_id"`
	Rating    int            `gorm:"column:rating"`
	Content   *string        `gorm:"column:content"`
	ImageURLs pq.StringArray `gorm:"type:text[];column:image_urls"`
	PostedAt  time.Time      `gorm:"column:posted_at"`
	CreatedAt time.Time      `gorm:"column:created_at"`
}

type User struct {
	UserID    string     `gorm:"column:user_id;primaryKey;type:uuid"`
	Name      string     `gorm:"column:name"`
	Email     string     `gorm:"column:email"`
	IconURL   *string    `gorm:"column:icon_url"`
	Gender    *string    `gorm:"column:gender"`
	Birthday  *time.Time `gorm:"column:birthday"`
	Role      string     `gorm:"column:role;default:user"`
	CreatedAt time.Time  `gorm:"column:created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at"`
}

type Favorite struct {
	FavoriteID int64     `gorm:"column:favorite_id;primaryKey;autoIncrement"`
	UserID     string    `gorm:"column:user_id;type:uuid"`
	StoreID    int64     `gorm:"column:store_id"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	Store      *Store    `gorm:"foreignKey:StoreID;references:StoreID"`
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

type Media struct {
	MediaID   int64     `gorm:"column:media_id;primaryKey;autoIncrement"`
	UserID    string    `gorm:"column:user_id;type:uuid"`
	URL       string    `gorm:"column:url"`
	FileType  string    `gorm:"column:file_type"`
	FileSize  int64     `gorm:"column:file_size"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func StoreModelFromDomain(store *domain.Store) *Store {
	if store == nil {
		return nil
	}
	model := &Store{
		StoreID:         store.StoreID,
		ThumbnailURL:    store.ThumbnailURL,
		Name:            store.Name,
		OpenedAt:        store.OpenedAt,
		Description:     store.Description,
		LandscapePhotos: pq.StringArray(store.LandscapePhotos),
		Address:         store.Address,
		OpeningHours:    store.OpeningHours,
		Latitude:        store.Latitude,
		Longitude:       store.Longitude,
		IsApproved:      store.IsApproved,
		CreatedAt:       store.CreatedAt,
		UpdatedAt:       store.UpdatedAt,
	}
	return model
}

func StoreModelToDomain(m Store) domain.Store {
	store := domain.Store{
		StoreID:         m.StoreID,
		ThumbnailURL:    m.ThumbnailURL,
		Name:            m.Name,
		OpenedAt:        m.OpenedAt,
		Description:     m.Description,
		LandscapePhotos: append([]string(nil), []string(m.LandscapePhotos)...),
		Address:         m.Address,
		OpeningHours:    m.OpeningHours,
		Latitude:        m.Latitude,
		Longitude:       m.Longitude,
		IsApproved:      m.IsApproved,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
	if len(m.Menus) > 0 {
		store.Menus = make([]domain.Menu, len(m.Menus))
		for i, menu := range m.Menus {
			store.Menus[i] = MenuModelToDomain(menu)
		}
	}
	if len(m.Reviews) > 0 {
		store.Reviews = make([]domain.Review, len(m.Reviews))
		for i, review := range m.Reviews {
			store.Reviews[i] = ReviewModelToDomain(review)
		}
	}
	return store
}

func MenuModelFromDomain(m *domain.Menu) *Menu {
	if m == nil {
		return nil
	}
	return &Menu{
		MenuID:      m.MenuID,
		StoreID:     m.StoreID,
		Name:        m.Name,
		Price:       m.Price,
		ImageURL:    m.ImageURL,
		Description: m.Description,
		CreatedAt:   m.CreatedAt,
	}
}

func MenuModelToDomain(m Menu) domain.Menu {
	return domain.Menu{
		MenuID:      m.MenuID,
		StoreID:     m.StoreID,
		Name:        m.Name,
		Price:       m.Price,
		ImageURL:    m.ImageURL,
		Description: m.Description,
		CreatedAt:   m.CreatedAt,
	}
}

func ReviewModelFromDomain(r *domain.Review) *Review {
	if r == nil {
		return nil
	}
	return &Review{
		ReviewID:  r.ReviewID,
		StoreID:   r.StoreID,
		UserID:    r.UserID,
		MenuID:    r.MenuID,
		Rating:    r.Rating,
		Content:   r.Content,
		ImageURLs: pq.StringArray(r.ImageURLs),
		PostedAt:  r.PostedAt,
		CreatedAt: r.CreatedAt,
	}
}

func ReviewModelToDomain(r Review) domain.Review {
	return domain.Review{
		ReviewID:  r.ReviewID,
		StoreID:   r.StoreID,
		UserID:    r.UserID,
		MenuID:    r.MenuID,
		Rating:    r.Rating,
		Content:   r.Content,
		ImageURLs: append([]string(nil), []string(r.ImageURLs)...),
		PostedAt:  r.PostedAt,
		CreatedAt: r.CreatedAt,
	}
}

func UserModelFromDomain(u *domain.User) *User {
	if u == nil {
		return nil
	}
	return &User{
		UserID:    u.UserID,
		Name:      u.Name,
		Email:     u.Email,
		IconURL:   u.IconURL,
		Gender:    u.Gender,
		Birthday:  u.Birthday,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func UserModelToDomain(u User) domain.User {
	return domain.User{
		UserID:    u.UserID,
		Name:      u.Name,
		Email:     u.Email,
		IconURL:   u.IconURL,
		Gender:    u.Gender,
		Birthday:  u.Birthday,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func FavoriteModelFromDomain(f *domain.Favorite) *Favorite {
	if f == nil {
		return nil
	}
	model := &Favorite{
		FavoriteID: f.FavoriteID,
		UserID:     f.UserID,
		StoreID:    f.StoreID,
		CreatedAt:  f.CreatedAt,
	}
	if f.Store != nil {
		model.Store = StoreModelFromDomain(f.Store)
	}
	return model
}

func FavoriteModelToDomain(f Favorite) domain.Favorite {
	domainFavorite := domain.Favorite{
		FavoriteID: f.FavoriteID,
		UserID:     f.UserID,
		StoreID:    f.StoreID,
		CreatedAt:  f.CreatedAt,
	}
	if f.Store != nil {
		store := StoreModelToDomain(*f.Store)
		domainFavorite.Store = &store
	}
	return domainFavorite
}

func ReportModelFromDomain(r *domain.Report) *Report {
	if r == nil {
		return nil
	}
	return &Report{
		ReportID:   r.ReportID,
		UserID:     r.UserID,
		TargetType: r.TargetType,
		TargetID:   r.TargetID,
		Reason:     r.Reason,
		Status:     r.Status,
		CreatedAt:  r.CreatedAt,
		UpdatedAt:  r.UpdatedAt,
	}
}

func ReportModelToDomain(r Report) domain.Report {
	return domain.Report{
		ReportID:   r.ReportID,
		UserID:     r.UserID,
		TargetType: r.TargetType,
		TargetID:   r.TargetID,
		Reason:     r.Reason,
		Status:     r.Status,
		CreatedAt:  r.CreatedAt,
		UpdatedAt:  r.UpdatedAt,
	}
}

func MediaModelFromDomain(m *domain.Media) *Media {
	if m == nil {
		return nil
	}
	return &Media{
		MediaID:   m.MediaID,
		UserID:    m.UserID,
		URL:       m.URL,
		FileType:  m.FileType,
		FileSize:  m.FileSize,
		CreatedAt: m.CreatedAt,
	}
}

func MediaModelToDomain(m Media) domain.Media {
	return domain.Media{
		MediaID:   m.MediaID,
		UserID:    m.UserID,
		URL:       m.URL,
		FileType:  m.FileType,
		FileSize:  m.FileSize,
		CreatedAt: m.CreatedAt,
	}
}
