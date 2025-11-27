package presenter

import (
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type StoreResponse struct {
	StoreID         int64            `json:"store_id"`
	ThumbnailURL    string           `json:"thumbnail_url"`
	Name            string           `json:"name"`
	OpenedAt        *time.Time       `json:"opened_at,omitempty"`
	Description     *string          `json:"description,omitempty"`
	LandscapePhotos []string         `json:"landscape_photos,omitempty"`
	Address         string           `json:"address"`
	OpeningHours    *string          `json:"opening_hours,omitempty"`
	Latitude        float64          `json:"latitude"`
	Longitude       float64          `json:"longitude"`
	IsApproved      bool             `json:"is_approved"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	Menus           []MenuResponse   `json:"menus,omitempty"`
	Reviews         []ReviewResponse `json:"reviews,omitempty"`
}

type MenuResponse struct {
	MenuID      int64     `json:"menu_id"`
	StoreID     int64     `json:"store_id"`
	Name        string    `json:"name"`
	Price       *int      `json:"price,omitempty"`
	ImageURL    *string   `json:"image_url,omitempty"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type ReviewResponse struct {
	ReviewID  int64     `json:"review_id"`
	StoreID   int64     `json:"store_id"`
	UserID    string    `json:"user_id"`
	MenuID    int64     `json:"menu_id"`
	Rating    int       `json:"rating"`
	Content   *string   `json:"content,omitempty"`
	ImageURLs []string  `json:"image_urls,omitempty"`
	PostedAt  time.Time `json:"posted_at"`
	CreatedAt time.Time `json:"created_at"`
}

type UserResponse struct {
	UserID    string     `json:"user_id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	IconURL   *string    `json:"icon_url,omitempty"`
	Gender    *string    `json:"gender,omitempty"`
	Birthday  *time.Time `json:"birthday,omitempty"`
	Role      string     `json:"role"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type FavoriteResponse struct {
	FavoriteID int64          `json:"favorite_id"`
	UserID     string         `json:"user_id"`
	StoreID    int64          `json:"store_id"`
	CreatedAt  time.Time      `json:"created_at"`
	Store      *StoreResponse `json:"store,omitempty"`
}

type ReportResponse struct {
	ReportID   int64     `json:"report_id"`
	UserID     string    `json:"user_id"`
	TargetType string    `json:"target_type"`
	TargetID   int64     `json:"target_id"`
	Reason     string    `json:"reason"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type MediaResponse struct {
	MediaID   int64     `json:"media_id"`
	UserID    string    `json:"user_id"`
	URL       string    `json:"url"`
	FileType  string    `json:"file_type"`
	FileSize  int64     `json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthSessionResponse struct {
	AccessToken  string            `json:"access_token"`
	RefreshToken string            `json:"refresh_token"`
	TokenType    string            `json:"token_type"`
	ExpiresIn    int               `json:"expires_in"`
	User         AuthUserResponse  `json:"user"`
}

type AuthUserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func NewStoreResponse(store domain.Store) StoreResponse {
	resp := StoreResponse{
		StoreID:         store.StoreID,
		ThumbnailURL:    store.ThumbnailURL,
		Name:            store.Name,
		OpenedAt:        store.OpenedAt,
		Description:     store.Description,
		LandscapePhotos: append([]string(nil), store.LandscapePhotos...),
		Address:         store.Address,
		OpeningHours:    store.OpeningHours,
		Latitude:        store.Latitude,
		Longitude:       store.Longitude,
		IsApproved:      store.IsApproved,
		CreatedAt:       store.CreatedAt,
		UpdatedAt:       store.UpdatedAt,
	}
	if len(store.Menus) > 0 {
		resp.Menus = NewMenuResponses(store.Menus)
	}
	if len(store.Reviews) > 0 {
		resp.Reviews = NewReviewResponses(store.Reviews)
	}
	return resp
}

func NewStoreResponses(stores []domain.Store) []StoreResponse {
	if len(stores) == 0 {
		return nil
	}
	resp := make([]StoreResponse, len(stores))
	for i, store := range stores {
		resp[i] = NewStoreResponse(store)
	}
	return resp
}

func NewMenuResponse(menu domain.Menu) MenuResponse {
	return MenuResponse{
		MenuID:      menu.MenuID,
		StoreID:     menu.StoreID,
		Name:        menu.Name,
		Price:       menu.Price,
		ImageURL:    menu.ImageURL,
		Description: menu.Description,
		CreatedAt:   menu.CreatedAt,
	}
}

func NewMenuResponses(menus []domain.Menu) []MenuResponse {
	if len(menus) == 0 {
		return nil
	}
	resp := make([]MenuResponse, len(menus))
	for i, menu := range menus {
		resp[i] = NewMenuResponse(menu)
	}
	return resp
}

func NewReviewResponse(review domain.Review) ReviewResponse {
	return ReviewResponse{
		ReviewID:  review.ReviewID,
		StoreID:   review.StoreID,
		UserID:    review.UserID,
		MenuID:    review.MenuID,
		Rating:    review.Rating,
		Content:   review.Content,
		ImageURLs: append([]string(nil), review.ImageURLs...),
		PostedAt:  review.PostedAt,
		CreatedAt: review.CreatedAt,
	}
}

func NewReviewResponses(reviews []domain.Review) []ReviewResponse {
	if len(reviews) == 0 {
		return nil
	}
	resp := make([]ReviewResponse, len(reviews))
	for i, review := range reviews {
		resp[i] = NewReviewResponse(review)
	}
	return resp
}

func NewUserResponse(user domain.User) UserResponse {
	return UserResponse{
		UserID:    user.UserID,
		Name:      user.Name,
		Email:     user.Email,
		IconURL:   user.IconURL,
		Gender:    user.Gender,
		Birthday:  user.Birthday,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}

func NewFavoriteResponse(f domain.Favorite) FavoriteResponse {
	return FavoriteResponse{
		FavoriteID: f.FavoriteID,
		UserID:     f.UserID,
		StoreID:    f.StoreID,
		CreatedAt:  f.CreatedAt,
	}
}

func NewFavoriteResponses(favorites []domain.Favorite) []FavoriteResponse {
	if len(favorites) == 0 {
		return nil
	}
	resp := make([]FavoriteResponse, len(favorites))
	for i, favorite := range favorites {
		resp[i] = NewFavoriteResponse(favorite)
	}
	return resp
}

func NewAuthSessionResponse(session *usecase.AuthSession) AuthSessionResponse {
	if session == nil {
		return AuthSessionResponse{}
	}
	return AuthSessionResponse{
		AccessToken:  session.AccessToken,
		RefreshToken: session.RefreshToken,
		TokenType:    session.TokenType,
		ExpiresIn:    session.ExpiresIn,
		User:         NewAuthUserResponse(session.User),
	}
}

func NewAuthUserResponse(user usecase.AuthUser) AuthUserResponse {
	return AuthUserResponse{
		ID:    user.ID,
		Email: user.Email,
		Role:  user.Role,
	}
}

func NewReportResponse(report domain.Report) ReportResponse {
	return ReportResponse{
		ReportID:   report.ReportID,
		UserID:     report.UserID,
		TargetType: report.TargetType,
		TargetID:   report.TargetID,
		Reason:     report.Reason,
		Status:     report.Status,
		CreatedAt:  report.CreatedAt,
		UpdatedAt:  report.UpdatedAt,
	}
}

func NewReportResponses(reports []domain.Report) []ReportResponse {
	if len(reports) == 0 {
		return nil
	}
	resp := make([]ReportResponse, len(reports))
	for i, report := range reports {
		resp[i] = NewReportResponse(report)
	}
	return resp
}

func NewMediaResponse(media domain.Media) MediaResponse {
	return MediaResponse{
		MediaID:   media.MediaID,
		UserID:    media.UserID,
		URL:       media.URL,
		FileType:  media.FileType,
		FileSize:  media.FileSize,
		CreatedAt: media.CreatedAt,
	}
}
