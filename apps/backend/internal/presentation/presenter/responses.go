package presenter

import (
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type StoreResponse struct {
	StoreID         string           `json:"store_id"`
	ThumbnailFileID *string          `json:"thumbnail_file_id,omitempty"`
	ThumbnailFile   *FileResponse    `json:"thumbnail_file,omitempty"`
	Name            string           `json:"name"`
	OpenedAt        *time.Time       `json:"opened_at,omitempty"`
	Description     *string          `json:"description,omitempty"`
	Address         string           `json:"address"`
	PlaceID         string           `json:"place_id"`
	OpeningHours    *string          `json:"opening_hours,omitempty"`
	Latitude        float64          `json:"latitude"`
	Longitude       float64          `json:"longitude"`
	GoogleMapURL    *string          `json:"google_map_url,omitempty"`
	IsApproved      bool             `json:"is_approved"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	Menus           []MenuResponse   `json:"menus,omitempty"`
	Reviews         []ReviewResponse `json:"reviews,omitempty"`
}

type MenuResponse struct {
	MenuID      string    `json:"menu_id"`
	StoreID     string    `json:"store_id"`
	Name        string    `json:"name"`
	Price       *int      `json:"price,omitempty"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type ReviewResponse struct {
	ReviewID   string         `json:"review_id"`
	StoreID    string         `json:"store_id"`
	UserID     string         `json:"user_id"`
	Rating     int            `json:"rating"`
	Content    *string        `json:"content,omitempty"`
	MenuIDs    []string       `json:"menu_ids,omitempty"`
	Menus      []MenuResponse `json:"menus,omitempty"`
	FileIDs    []string       `json:"file_ids,omitempty"`
	Files      []FileResponse `json:"files,omitempty"`
	LikesCount int            `json:"likes_count"`
	LikedByMe  bool           `json:"liked_by_me"`
	CreatedAt  time.Time      `json:"created_at"`
}

type UserResponse struct {
	UserID     string     `json:"user_id"`
	Name       string     `json:"name"`
	Email      string     `json:"email"`
	IconFileID *string    `json:"icon_file_id,omitempty"`
	IconURL    *string    `json:"icon_url,omitempty"`
	Provider   string     `json:"provider"`
	Gender     *string    `json:"gender,omitempty"`
	Birthday   *time.Time `json:"birthday,omitempty"`
	Role       string     `json:"role"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type FavoriteResponse struct {
	UserID    string         `json:"user_id"`
	StoreID   string         `json:"store_id"`
	CreatedAt time.Time      `json:"created_at"`
	Store     *StoreResponse `json:"store,omitempty"`
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

type FileResponse struct {
	FileID      string    `json:"file_id"`
	FileKind    string    `json:"file_kind"`
	FileName    string    `json:"file_name"`
	FileSize    *int64    `json:"file_size,omitempty"`
	ObjectKey   string    `json:"object_key"`
	ContentType *string   `json:"content_type,omitempty"`
	IsDeleted   bool      `json:"is_deleted"`
	CreatedAt   time.Time `json:"created_at"`
	CreatedBy   *string   `json:"created_by,omitempty"`
}

type AuthSessionResponse struct {
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
	TokenType    string           `json:"token_type"`
	ExpiresIn    int              `json:"expires_in"`
	User         AuthUserResponse `json:"user"`
}

type AuthUserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func NewStoreResponse(store entity.Store) StoreResponse {
	resp := StoreResponse{
		StoreID:         store.StoreID,
		ThumbnailFileID: store.ThumbnailFileID,
		Name:            store.Name,
		OpenedAt:        store.OpenedAt,
		Description:     store.Description,
		Address:         store.Address,
		PlaceID:         store.PlaceID,
		OpeningHours:    store.OpeningHours,
		Latitude:        store.Latitude,
		Longitude:       store.Longitude,
		GoogleMapURL:    store.GoogleMapURL,
		IsApproved:      store.IsApproved,
		CreatedAt:       store.CreatedAt,
		UpdatedAt:       store.UpdatedAt,
	}
	if store.ThumbnailFile != nil {
		file := NewFileResponse(*store.ThumbnailFile)
		resp.ThumbnailFile = &file
	}
	if len(store.Menus) > 0 {
		resp.Menus = NewMenuResponses(store.Menus)
	}
	if len(store.Reviews) > 0 {
		resp.Reviews = NewReviewResponses(store.Reviews)
	}
	return resp
}

func NewStoreResponses(stores []entity.Store) []StoreResponse {
	if len(stores) == 0 {
		return []StoreResponse{}
	}
	resp := make([]StoreResponse, len(stores))
	for i, store := range stores {
		resp[i] = NewStoreResponse(store)
	}
	return resp
}

func NewMenuResponse(menu entity.Menu) MenuResponse {
	return MenuResponse{
		MenuID:      menu.MenuID,
		StoreID:     menu.StoreID,
		Name:        menu.Name,
		Price:       menu.Price,
		Description: menu.Description,
		CreatedAt:   menu.CreatedAt,
	}
}

func NewMenuResponses(menus []entity.Menu) []MenuResponse {
	if len(menus) == 0 {
		return []MenuResponse{}
	}
	resp := make([]MenuResponse, len(menus))
	for i, menu := range menus {
		resp[i] = NewMenuResponse(menu)
	}
	return resp
}

func NewReviewResponse(review entity.Review) ReviewResponse {
	resp := ReviewResponse{
		ReviewID:   review.ReviewID,
		StoreID:    review.StoreID,
		UserID:     review.UserID,
		Rating:     review.Rating,
		Content:    review.Content,
		LikesCount: review.LikesCount,
		LikedByMe:  review.LikedByMe,
		CreatedAt:  review.CreatedAt,
	}
	if len(review.Menus) > 0 {
		resp.Menus = NewMenuResponses(review.Menus)
		resp.MenuIDs = collectMenuIDs(review.Menus)
	}
	if len(review.Files) > 0 {
		resp.Files = NewFileResponses(review.Files)
		resp.FileIDs = collectFileIDs(review.Files)
	}
	return resp
}

func NewReviewResponses(reviews []entity.Review) []ReviewResponse {
	if len(reviews) == 0 {
		return []ReviewResponse{}
	}
	resp := make([]ReviewResponse, len(reviews))
	for i, review := range reviews {
		resp[i] = NewReviewResponse(review)
	}
	return resp
}

func NewUserResponse(user entity.User) UserResponse {
	return UserResponse{
		UserID:     user.UserID,
		Name:       user.Name,
		Email:      user.Email,
		IconFileID: user.IconFileID,
		IconURL:    user.IconURL,
		Provider:   user.Provider,
		Gender:     user.Gender,
		Birthday:   user.Birthday,
		Role:       user.Role,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,
	}
}

func NewFavoriteResponse(f entity.Favorite) FavoriteResponse {
	return FavoriteResponse{
		UserID:    f.UserID,
		StoreID:   f.StoreID,
		CreatedAt: f.CreatedAt,
	}
}

func NewFavoriteResponses(favorites []entity.Favorite) []FavoriteResponse {
	if len(favorites) == 0 {
		return []FavoriteResponse{}
	}
	resp := make([]FavoriteResponse, len(favorites))
	for i, favorite := range favorites {
		resp[i] = NewFavoriteResponse(favorite)
	}
	return resp
}

func NewFileResponse(file entity.File) FileResponse {
	return FileResponse{
		FileID:      file.FileID,
		FileKind:    file.FileKind,
		FileName:    file.FileName,
		FileSize:    file.FileSize,
		ObjectKey:   file.ObjectKey,
		ContentType: file.ContentType,
		IsDeleted:   file.IsDeleted,
		CreatedAt:   file.CreatedAt,
		CreatedBy:   file.CreatedBy,
	}
}

func NewFileResponses(files []entity.File) []FileResponse {
	if len(files) == 0 {
		return []FileResponse{}
	}
	resp := make([]FileResponse, len(files))
	for i, file := range files {
		resp[i] = NewFileResponse(file)
	}
	return resp
}

func collectMenuIDs(menus []entity.Menu) []string {
	ids := make([]string, len(menus))
	for i, menu := range menus {
		ids[i] = menu.MenuID
	}
	return ids
}

func collectFileIDs(files []entity.File) []string {
	ids := make([]string, len(files))
	for i, file := range files {
		ids[i] = file.FileID
	}
	return ids
}

func NewAuthSessionResponse(session *input.AuthSession) AuthSessionResponse {
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

func NewAuthUserResponse(user input.AuthUser) AuthUserResponse {
	return AuthUserResponse{
		ID:    user.ID,
		Email: user.Email,
		Role:  user.Role,
	}
}

func NewReportResponse(report entity.Report) ReportResponse {
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

func NewReportResponses(reports []entity.Report) []ReportResponse {
	if len(reports) == 0 {
		return []ReportResponse{}
	}
	resp := make([]ReportResponse, len(reports))
	for i, report := range reports {
		resp[i] = NewReportResponse(report)
	}
	return resp
}
