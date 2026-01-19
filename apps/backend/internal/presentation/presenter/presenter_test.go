package presenter

import (
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/stretchr/testify/require"
)

// Helper functions for creating test data

func ptrString(s string) *string {
	return &s
}

func ptrInt(i int) *int {
	return &i
}

func ptrInt64(i int64) *int64 {
	return &i
}

func ptrTime(t time.Time) *time.Time {
	return &t
}

func testTime() time.Time {
	return time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC)
}

func testTimeUpdated() time.Time {
	return time.Date(2024, 1, 16, 12, 0, 0, 0, time.UTC)
}

// Test helper functions for creating entities

func createFullFile() entity.File {
	return entity.File{
		FileID:      "file-001",
		FileKind:    "image",
		FileName:    "test-image.jpg",
		FileSize:    ptrInt64(1024),
		ObjectKey:   "uploads/test-image.jpg",
		ContentType: ptrString("image/jpeg"),
		IsDeleted:   false,
		CreatedAt:   testTime(),
		CreatedBy:   ptrString("user-001"),
	}
}

func createMinimalFile() entity.File {
	return entity.File{
		FileID:    "file-002",
		FileKind:  "document",
		FileName:  "doc.pdf",
		ObjectKey: "uploads/doc.pdf",
		IsDeleted: false,
		CreatedAt: testTime(),
	}
}

func createFullMenu() entity.Menu {
	return entity.Menu{
		MenuID:      "menu-001",
		StoreID:     "store-001",
		Name:        "Signature Ramen",
		Price:       ptrInt(1200),
		Description: ptrString("Our most popular ramen dish"),
		CreatedAt:   testTime(),
	}
}

func createMinimalMenu() entity.Menu {
	return entity.Menu{
		MenuID:    "menu-002",
		StoreID:   "store-001",
		Name:      "Basic Ramen",
		CreatedAt: testTime(),
	}
}

func createFullReview() entity.Review {
	return entity.Review{
		ReviewID:   "review-001",
		StoreID:    "store-001",
		UserID:     "user-001",
		Rating:     5,
		Content:    ptrString("Excellent food and service!"),
		Menus:      []entity.Menu{createFullMenu(), createMinimalMenu()},
		Files:      []entity.File{createFullFile()},
		LikesCount: 10,
		LikedByMe:  true,
		CreatedAt:  testTime(),
	}
}

func createMinimalReview() entity.Review {
	return entity.Review{
		ReviewID:  "review-002",
		StoreID:   "store-001",
		UserID:    "user-002",
		Rating:    3,
		CreatedAt: testTime(),
	}
}

func createFullStore() entity.Store {
	thumbnailFile := createFullFile()
	return entity.Store{
		StoreID:         "store-001",
		ThumbnailFileID: ptrString("file-001"),
		ThumbnailFile:   &thumbnailFile,
		Name:            "Test Ramen Shop",
		OpenedAt:        ptrTime(testTime()),
		Description:     ptrString("Best ramen in town"),
		Address:         "123 Test Street, Tokyo",
		PlaceID:         "place-001",
		OpeningHours:    ptrString("10:00-22:00"),
		Latitude:        35.6762,
		Longitude:       139.6503,
		GoogleMapURL:    ptrString("https://maps.google.com/test"),
		IsApproved:      true,
		Category:        "ramen",
		Budget:          "medium",
		AverageRating:   4.5,
		DistanceMinutes: 10,
		Tags:            []string{"ramen", "japanese", "noodles"},
		Files:           []entity.File{createFullFile()},
		CreatedAt:       testTime(),
		UpdatedAt:       testTimeUpdated(),
		Menus:           []entity.Menu{createFullMenu()},
		Reviews:         []entity.Review{createMinimalReview()},
	}
}

func createMinimalStore() entity.Store {
	return entity.Store{
		StoreID:   "store-002",
		Name:      "Minimal Store",
		Address:   "456 Minimal Ave",
		PlaceID:   "place-002",
		Category:  "cafe",
		Budget:    "low",
		CreatedAt: testTime(),
		UpdatedAt: testTimeUpdated(),
	}
}

func createFullUser() entity.User {
	return entity.User{
		UserID:     "user-001",
		Name:       "Test User",
		Email:      "test@example.com",
		IconFileID: ptrString("file-001"),
		IconURL:    ptrString("https://example.com/icon.jpg"),
		Provider:   "google",
		Gender:     ptrString("male"),
		Birthday:   ptrTime(time.Date(1990, 5, 15, 0, 0, 0, 0, time.UTC)),
		Role:       "user",
		CreatedAt:  testTime(),
		UpdatedAt:  testTimeUpdated(),
	}
}

func createMinimalUser() entity.User {
	return entity.User{
		UserID:    "user-002",
		Name:      "Minimal User",
		Email:     "minimal@example.com",
		Provider:  "email",
		Role:      "user",
		CreatedAt: testTime(),
		UpdatedAt: testTimeUpdated(),
	}
}

func createFullFavorite() entity.Favorite {
	store := createFullStore()
	return entity.Favorite{
		UserID:    "user-001",
		StoreID:   "store-001",
		CreatedAt: testTime(),
		Store:     &store,
	}
}

func createMinimalFavorite() entity.Favorite {
	return entity.Favorite{
		UserID:    "user-002",
		StoreID:   "store-002",
		CreatedAt: testTime(),
	}
}

func createFullReport() entity.Report {
	return entity.Report{
		ReportID:   1,
		UserID:     "user-001",
		TargetType: "review",
		TargetID:   100,
		Reason:     "spam content",
		Status:     "pending",
		CreatedAt:  testTime(),
		UpdatedAt:  testTimeUpdated(),
	}
}

// assertOptionalString compares optional string pointers
func assertOptionalString(t *testing.T, field string, got, want *string) {
	t.Helper()
	if want == nil {
		require.Nil(t, got, "%s should be nil", field)
	} else {
		require.NotNil(t, got, "%s should not be nil", field)
		require.Equal(t, *want, *got, field)
	}
}

// assertOptionalInt64 compares optional int64 pointers
func assertOptionalInt64(t *testing.T, field string, got, want *int64) {
	t.Helper()
	if want == nil {
		require.Nil(t, got, "%s should be nil", field)
	} else {
		require.NotNil(t, got, "%s should not be nil", field)
		require.Equal(t, *want, *got, field)
	}
}

// assertOptionalInt compares optional int pointers
func assertOptionalInt(t *testing.T, field string, got, want *int) {
	t.Helper()
	if want == nil {
		require.Nil(t, got, "%s should be nil", field)
	} else {
		require.NotNil(t, got, "%s should not be nil", field)
		require.Equal(t, *want, *got, field)
	}
}

// assertOptionalTime compares optional time pointers
func assertOptionalTime(t *testing.T, field string, got, want *time.Time) {
	t.Helper()
	if want == nil {
		require.Nil(t, got, "%s should be nil", field)
	} else {
		require.NotNil(t, got, "%s should not be nil", field)
		require.True(t, got.Equal(*want), "%s: got %v, want %v", field, *got, *want)
	}
}

// Tests for NewFileResponse

func TestNewFileResponse(t *testing.T) {
	tests := []struct {
		name string
		file entity.File
		want FileResponse
	}{
		{
			name: "full file with all fields",
			file: createFullFile(),
			want: FileResponse{
				FileID:      "file-001",
				FileKind:    "image",
				FileName:    "test-image.jpg",
				FileSize:    ptrInt64(1024),
				ObjectKey:   "uploads/test-image.jpg",
				ContentType: ptrString("image/jpeg"),
				IsDeleted:   false,
				CreatedAt:   testTime(),
				CreatedBy:   ptrString("user-001"),
			},
		},
		{
			name: "minimal file with required fields only",
			file: createMinimalFile(),
			want: FileResponse{
				FileID:    "file-002",
				FileKind:  "document",
				FileName:  "doc.pdf",
				ObjectKey: "uploads/doc.pdf",
				IsDeleted: false,
				CreatedAt: testTime(),
			},
		},
		{
			name: "file with deleted flag",
			file: entity.File{
				FileID:    "file-003",
				FileKind:  "image",
				FileName:  "deleted.jpg",
				ObjectKey: "uploads/deleted.jpg",
				IsDeleted: true,
				CreatedAt: testTime(),
			},
			want: FileResponse{
				FileID:    "file-003",
				FileKind:  "image",
				FileName:  "deleted.jpg",
				ObjectKey: "uploads/deleted.jpg",
				IsDeleted: true,
				CreatedAt: testTime(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewFileResponse(tt.file)

			require.Equal(t, tt.want.FileID, got.FileID, "FileID")
			require.Equal(t, tt.want.FileKind, got.FileKind, "FileKind")
			require.Equal(t, tt.want.FileName, got.FileName, "FileName")
			require.Equal(t, tt.want.ObjectKey, got.ObjectKey, "ObjectKey")
			require.Equal(t, tt.want.IsDeleted, got.IsDeleted, "IsDeleted")
			require.True(t, got.CreatedAt.Equal(tt.want.CreatedAt), "CreatedAt")

			assertOptionalInt64(t, "FileSize", got.FileSize, tt.want.FileSize)
			assertOptionalString(t, "ContentType", got.ContentType, tt.want.ContentType)
			assertOptionalString(t, "CreatedBy", got.CreatedBy, tt.want.CreatedBy)
		})
	}
}

func TestNewFileResponses(t *testing.T) {
	tests := []struct {
		name  string
		files []entity.File
		want  int
	}{
		{
			name:  "empty slice",
			files: []entity.File{},
			want:  0,
		},
		{
			name:  "single file",
			files: []entity.File{createFullFile()},
			want:  1,
		},
		{
			name:  "multiple files",
			files: []entity.File{createFullFile(), createMinimalFile()},
			want:  2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewFileResponses(tt.files)
			if len(got) != tt.want {
				t.Errorf("len(NewFileResponses) = %v, want %v", len(got), tt.want)
			}
			// Verify empty slice returns empty slice, not nil
			if tt.want == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// Tests for NewMenuResponse

func TestNewMenuResponse(t *testing.T) {
	tests := []struct {
		name string
		menu entity.Menu
		want MenuResponse
	}{
		{
			name: "full menu with all fields",
			menu: createFullMenu(),
			want: MenuResponse{
				MenuID:      "menu-001",
				StoreID:     "store-001",
				Name:        "Signature Ramen",
				Price:       ptrInt(1200),
				Description: ptrString("Our most popular ramen dish"),
				CreatedAt:   testTime(),
			},
		},
		{
			name: "minimal menu with required fields only",
			menu: createMinimalMenu(),
			want: MenuResponse{
				MenuID:    "menu-002",
				StoreID:   "store-001",
				Name:      "Basic Ramen",
				CreatedAt: testTime(),
			},
		},
		{
			name: "menu with zero price",
			menu: entity.Menu{
				MenuID:    "menu-003",
				StoreID:   "store-001",
				Name:      "Free Sample",
				Price:     ptrInt(0),
				CreatedAt: testTime(),
			},
			want: MenuResponse{
				MenuID:    "menu-003",
				StoreID:   "store-001",
				Name:      "Free Sample",
				Price:     ptrInt(0),
				CreatedAt: testTime(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewMenuResponse(tt.menu)

			require.Equal(t, tt.want.MenuID, got.MenuID, "MenuID")
			require.Equal(t, tt.want.StoreID, got.StoreID, "StoreID")
			require.Equal(t, tt.want.Name, got.Name, "Name")
			require.True(t, got.CreatedAt.Equal(tt.want.CreatedAt), "CreatedAt")

			assertOptionalInt(t, "Price", got.Price, tt.want.Price)
			assertOptionalString(t, "Description", got.Description, tt.want.Description)
		})
	}
}

func TestNewMenuResponses(t *testing.T) {
	tests := []struct {
		name  string
		menus []entity.Menu
		want  int
	}{
		{
			name:  "empty slice",
			menus: []entity.Menu{},
			want:  0,
		},
		{
			name:  "single menu",
			menus: []entity.Menu{createFullMenu()},
			want:  1,
		},
		{
			name:  "multiple menus",
			menus: []entity.Menu{createFullMenu(), createMinimalMenu()},
			want:  2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewMenuResponses(tt.menus)
			if len(got) != tt.want {
				t.Errorf("len(NewMenuResponses) = %v, want %v", len(got), tt.want)
			}
			if tt.want == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// assertReviewRequiredFields verifies required fields of ReviewResponse
func assertReviewRequiredFields(t *testing.T, got ReviewResponse, want entity.Review) {
	t.Helper()
	require.Equal(t, want.ReviewID, got.ReviewID, "ReviewID")
	require.Equal(t, want.StoreID, got.StoreID, "StoreID")
	require.Equal(t, want.UserID, got.UserID, "UserID")
	require.Equal(t, want.Rating, got.Rating, "Rating")
	require.Equal(t, want.LikesCount, got.LikesCount, "LikesCount")
	require.Equal(t, want.LikedByMe, got.LikedByMe, "LikedByMe")
	require.True(t, got.CreatedAt.Equal(want.CreatedAt), "CreatedAt")
}

// assertReviewCollections verifies menus and files collections of ReviewResponse
func assertReviewCollections(t *testing.T, got ReviewResponse, want entity.Review) {
	t.Helper()
	if len(want.Menus) > 0 {
		require.Len(t, got.Menus, len(want.Menus), "Menus length")
		require.Len(t, got.MenuIDs, len(want.Menus), "MenuIDs length")
	} else {
		require.Nil(t, got.Menus, "Menus should be nil for empty/nil input")
	}

	if len(want.Files) > 0 {
		require.Len(t, got.Files, len(want.Files), "Files length")
		require.Len(t, got.FileIDs, len(want.Files), "FileIDs length")
	} else {
		require.Nil(t, got.Files, "Files should be nil for empty/nil input")
	}
}

// Tests for NewReviewResponse

func TestNewReviewResponse(t *testing.T) {
	tests := []struct {
		name   string
		review entity.Review
	}{
		{name: "full review with all fields", review: createFullReview()},
		{name: "minimal review with required fields only", review: createMinimalReview()},
		{
			name: "review with empty menus and files",
			review: entity.Review{
				ReviewID: "review-003", StoreID: "store-001", UserID: "user-003",
				Rating: 4, Content: ptrString("Good food"),
				Menus: []entity.Menu{}, Files: []entity.File{},
				LikesCount: 5, LikedByMe: false, CreatedAt: testTime(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewReviewResponse(tt.review)
			assertReviewRequiredFields(t, got, tt.review)
			assertOptionalString(t, "Content", got.Content, tt.review.Content)
			assertReviewCollections(t, got, tt.review)
		})
	}
}

func TestNewReviewResponses(t *testing.T) {
	tests := []struct {
		name    string
		reviews []entity.Review
		want    int
	}{
		{
			name:    "empty slice",
			reviews: []entity.Review{},
			want:    0,
		},
		{
			name:    "single review",
			reviews: []entity.Review{createFullReview()},
			want:    1,
		},
		{
			name:    "multiple reviews",
			reviews: []entity.Review{createFullReview(), createMinimalReview()},
			want:    2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewReviewResponses(tt.reviews)
			if len(got) != tt.want {
				t.Errorf("len(NewReviewResponses) = %v, want %v", len(got), tt.want)
			}
			if tt.want == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// assertUserRequiredFields verifies required fields of UserResponse
func assertUserRequiredFields(t *testing.T, got UserResponse, want entity.User) {
	t.Helper()
	require.Equal(t, want.UserID, got.UserID, "UserID")
	require.Equal(t, want.Name, got.Name, "Name")
	require.Equal(t, want.Email, got.Email, "Email")
	require.Equal(t, want.Provider, got.Provider, "Provider")
	require.Equal(t, want.Role, got.Role, "Role")
	require.True(t, got.CreatedAt.Equal(want.CreatedAt), "CreatedAt")
	require.True(t, got.UpdatedAt.Equal(want.UpdatedAt), "UpdatedAt")
}

// assertUserOptionalFields verifies optional fields of UserResponse
func assertUserOptionalFields(t *testing.T, got UserResponse, want entity.User) {
	t.Helper()
	assertOptionalString(t, "IconFileID", got.IconFileID, want.IconFileID)
	assertOptionalString(t, "IconURL", got.IconURL, want.IconURL)
	assertOptionalString(t, "Gender", got.Gender, want.Gender)
	assertOptionalTime(t, "Birthday", got.Birthday, want.Birthday)
}

// Tests for NewUserResponse

func TestNewUserResponse(t *testing.T) {
	tests := []struct {
		name string
		user entity.User
	}{
		{name: "full user with all fields", user: createFullUser()},
		{name: "minimal user with required fields only", user: createMinimalUser()},
		{
			name: "user with empty optional strings",
			user: entity.User{
				UserID: "user-003", Name: "Test User 3", Email: "test3@example.com",
				Provider: "apple", Role: "admin", CreatedAt: testTime(), UpdatedAt: testTimeUpdated(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewUserResponse(tt.user)
			assertUserRequiredFields(t, got, tt.user)
			assertUserOptionalFields(t, got, tt.user)
		})
	}
}

// Tests for NewFavoriteResponse

func TestNewFavoriteResponse(t *testing.T) {
	tests := []struct {
		name     string
		favorite entity.Favorite
	}{
		{
			name:     "favorite with store",
			favorite: createFullFavorite(),
		},
		{
			name:     "minimal favorite without store",
			favorite: createMinimalFavorite(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewFavoriteResponse(tt.favorite)

			if got.UserID != tt.favorite.UserID {
				t.Errorf("UserID = %v, want %v", got.UserID, tt.favorite.UserID)
			}
			if got.StoreID != tt.favorite.StoreID {
				t.Errorf("StoreID = %v, want %v", got.StoreID, tt.favorite.StoreID)
			}
			if !got.CreatedAt.Equal(tt.favorite.CreatedAt) {
				t.Errorf("CreatedAt = %v, want %v", got.CreatedAt, tt.favorite.CreatedAt)
			}
			// Note: The current implementation doesn't convert Store field
			// This test documents the current behavior
			if got.Store != nil {
				t.Errorf("Store should be nil in current implementation, got %v", got.Store)
			}
		})
	}
}

func TestNewFavoriteResponses(t *testing.T) {
	tests := []struct {
		name      string
		favorites []entity.Favorite
		want      int
	}{
		{
			name:      "empty slice",
			favorites: []entity.Favorite{},
			want:      0,
		},
		{
			name:      "single favorite",
			favorites: []entity.Favorite{createFullFavorite()},
			want:      1,
		},
		{
			name:      "multiple favorites",
			favorites: []entity.Favorite{createFullFavorite(), createMinimalFavorite()},
			want:      2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewFavoriteResponses(tt.favorites)
			if len(got) != tt.want {
				t.Errorf("len(NewFavoriteResponses) = %v, want %v", len(got), tt.want)
			}
			if tt.want == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// assertStoreRequiredFields verifies required fields of StoreResponse
func assertStoreRequiredFields(t *testing.T, got StoreResponse, want entity.Store) {
	t.Helper()
	require.Equal(t, want.StoreID, got.StoreID, "StoreID")
	require.Equal(t, want.Name, got.Name, "Name")
	require.Equal(t, want.Address, got.Address, "Address")
	require.Equal(t, want.PlaceID, got.PlaceID, "PlaceID")
	require.Equal(t, want.Latitude, got.Latitude, "Latitude")
	require.Equal(t, want.Longitude, got.Longitude, "Longitude")
	require.Equal(t, want.IsApproved, got.IsApproved, "IsApproved")
	require.Equal(t, want.Category, got.Category, "Category")
	require.Equal(t, want.Budget, got.Budget, "Budget")
	require.Equal(t, want.AverageRating, got.AverageRating, "AverageRating")
	require.Equal(t, want.DistanceMinutes, got.DistanceMinutes, "DistanceMinutes")
	require.True(t, got.CreatedAt.Equal(want.CreatedAt), "CreatedAt")
	require.True(t, got.UpdatedAt.Equal(want.UpdatedAt), "UpdatedAt")
}

// assertStoreOptionalFields verifies optional fields of StoreResponse
func assertStoreOptionalFields(t *testing.T, got StoreResponse, want entity.Store) {
	t.Helper()
	assertOptionalString(t, "ThumbnailFileID", got.ThumbnailFileID, want.ThumbnailFileID)
	assertOptionalString(t, "Description", got.Description, want.Description)
	assertOptionalTime(t, "OpenedAt", got.OpenedAt, want.OpenedAt)
	assertOptionalString(t, "OpeningHours", got.OpeningHours, want.OpeningHours)
	assertOptionalString(t, "GoogleMapURL", got.GoogleMapURL, want.GoogleMapURL)
}

// assertStoreCollections verifies collections and nested objects of StoreResponse
func assertStoreCollections(t *testing.T, got StoreResponse, want entity.Store) {
	t.Helper()
	require.NotNil(t, got.Tags, "Tags should not be nil")
	require.NotNil(t, got.ImageUrls, "ImageUrls should not be nil")

	if want.ThumbnailFile != nil {
		require.NotNil(t, got.ThumbnailFile, "ThumbnailFile should not be nil")
		require.Equal(t, want.ThumbnailFile.FileID, got.ThumbnailFile.FileID, "ThumbnailFile.FileID")
	}

	if len(want.Menus) > 0 {
		require.Len(t, got.Menus, len(want.Menus), "Menus length")
	}

	if len(want.Reviews) > 0 {
		require.Len(t, got.Reviews, len(want.Reviews), "Reviews length")
	}
}

// Tests for NewStoreResponse

func TestNewStoreResponse(t *testing.T) {
	tests := []struct {
		name  string
		store entity.Store
	}{
		{name: "full store with all fields", store: createFullStore()},
		{name: "minimal store with required fields only", store: createMinimalStore()},
		{
			name: "store with empty collections",
			store: entity.Store{
				StoreID: "store-003", Name: "Empty Collections Store", Address: "789 Empty Ave",
				PlaceID: "place-003", Category: "cafe", Budget: "high",
				Tags: []string{}, Files: []entity.File{}, Menus: []entity.Menu{}, Reviews: []entity.Review{},
				CreatedAt: testTime(), UpdatedAt: testTimeUpdated(),
			},
		},
		{
			name: "store with nil tags",
			store: entity.Store{
				StoreID: "store-004", Name: "Nil Tags Store", Address: "101 Nil St",
				PlaceID: "place-004", Category: "restaurant", Budget: "medium",
				Tags: nil, Files: nil, CreatedAt: testTime(), UpdatedAt: testTimeUpdated(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewStoreResponse(tt.store)
			assertStoreRequiredFields(t, got, tt.store)
			assertStoreOptionalFields(t, got, tt.store)
			assertStoreCollections(t, got, tt.store)
		})
	}
}

func TestNewStoreResponses(t *testing.T) {
	tests := []struct {
		name   string
		stores []entity.Store
		want   int
	}{
		{
			name:   "empty slice",
			stores: []entity.Store{},
			want:   0,
		},
		{
			name:   "single store",
			stores: []entity.Store{createFullStore()},
			want:   1,
		},
		{
			name:   "multiple stores",
			stores: []entity.Store{createFullStore(), createMinimalStore()},
			want:   2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewStoreResponses(tt.stores)
			if len(got) != tt.want {
				t.Errorf("len(NewStoreResponses) = %v, want %v", len(got), tt.want)
			}
			if tt.want == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// assertReportFields verifies all fields of ReportResponse
func assertReportFields(t *testing.T, got ReportResponse, want entity.Report) {
	t.Helper()
	require.Equal(t, want.ReportID, got.ReportID, "ReportID")
	require.Equal(t, want.UserID, got.UserID, "UserID")
	require.Equal(t, want.TargetType, got.TargetType, "TargetType")
	require.Equal(t, want.TargetID, got.TargetID, "TargetID")
	require.Equal(t, want.Reason, got.Reason, "Reason")
	require.Equal(t, want.Status, got.Status, "Status")
	require.True(t, got.CreatedAt.Equal(want.CreatedAt), "CreatedAt")
	require.True(t, got.UpdatedAt.Equal(want.UpdatedAt), "UpdatedAt")
}

// Tests for NewReportResponse

func TestNewReportResponse(t *testing.T) {
	tests := []struct {
		name   string
		report entity.Report
	}{
		{name: "full report", report: createFullReport()},
		{
			name: "report with different status",
			report: entity.Report{
				ReportID: 2, UserID: "user-002", TargetType: "store", TargetID: 200,
				Reason: "inappropriate content", Status: "resolved",
				CreatedAt: testTime(), UpdatedAt: testTimeUpdated(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewReportResponse(tt.report)
			assertReportFields(t, got, tt.report)
		})
	}
}

func TestNewReportResponses(t *testing.T) {
	tests := []struct {
		name    string
		reports []entity.Report
		want    int
	}{
		{
			name:    "empty slice",
			reports: []entity.Report{},
			want:    0,
		},
		{
			name:    "single report",
			reports: []entity.Report{createFullReport()},
			want:    1,
		},
		{
			name: "multiple reports",
			reports: []entity.Report{
				createFullReport(),
				{
					ReportID:   2,
					UserID:     "user-002",
					TargetType: "store",
					TargetID:   200,
					Reason:     "spam",
					Status:     "rejected",
					CreatedAt:  testTime(),
					UpdatedAt:  testTimeUpdated(),
				},
			},
			want: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewReportResponses(tt.reports)
			if len(got) != tt.want {
				t.Errorf("len(NewReportResponses) = %v, want %v", len(got), tt.want)
			}
			if tt.want == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// assertAuthSessionFields verifies all fields of AuthSessionResponse
func assertAuthSessionFields(t *testing.T, got AuthSessionResponse, want *input.AuthSession) {
	t.Helper()
	require.Equal(t, want.AccessToken, got.AccessToken, "AccessToken")
	require.Equal(t, want.RefreshToken, got.RefreshToken, "RefreshToken")
	require.Equal(t, want.TokenType, got.TokenType, "TokenType")
	require.Equal(t, want.ExpiresIn, got.ExpiresIn, "ExpiresIn")
	require.Equal(t, want.User.ID, got.User.ID, "User.ID")
	require.Equal(t, want.User.Email, got.User.Email, "User.Email")
	require.Equal(t, want.User.Role, got.User.Role, "User.Role")
}

// Tests for NewAuthSessionResponse

func TestNewAuthSessionResponse(t *testing.T) {
	t.Run("nil session returns zero values", func(t *testing.T) {
		got := NewAuthSessionResponse(nil)
		require.Empty(t, got.AccessToken, "AccessToken should be empty for nil session")
		require.Empty(t, got.RefreshToken, "RefreshToken should be empty for nil session")
	})

	tests := []struct {
		name    string
		session *input.AuthSession
	}{
		{
			name: "full auth session",
			session: &input.AuthSession{
				AccessToken: "access-token-123", RefreshToken: "refresh-token-456",
				TokenType: "Bearer", ExpiresIn: 3600,
				User: input.AuthUser{ID: "user-001", Email: "test@example.com", Role: "user"},
			},
		},
		{
			name: "session with admin user",
			session: &input.AuthSession{
				AccessToken: "admin-token", RefreshToken: "admin-refresh",
				TokenType: "Bearer", ExpiresIn: 7200,
				User: input.AuthUser{ID: "admin-001", Email: "admin@example.com", Role: "admin"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewAuthSessionResponse(tt.session)
			assertAuthSessionFields(t, got, tt.session)
		})
	}
}

// Tests for NewAuthUserResponse

func TestNewAuthUserResponse(t *testing.T) {
	tests := []struct {
		name string
		user input.AuthUser
	}{
		{
			name: "regular user",
			user: input.AuthUser{
				ID:    "user-001",
				Email: "test@example.com",
				Role:  "user",
			},
		},
		{
			name: "admin user",
			user: input.AuthUser{
				ID:    "admin-001",
				Email: "admin@example.com",
				Role:  "admin",
			},
		},
		{
			name: "empty user",
			user: input.AuthUser{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewAuthUserResponse(tt.user)

			if got.ID != tt.user.ID {
				t.Errorf("ID = %v, want %v", got.ID, tt.user.ID)
			}
			if got.Email != tt.user.Email {
				t.Errorf("Email = %v, want %v", got.Email, tt.user.Email)
			}
			if got.Role != tt.user.Role {
				t.Errorf("Role = %v, want %v", got.Role, tt.user.Role)
			}
		})
	}
}

// Tests for extractImageUrls

func TestExtractImageUrls(t *testing.T) {
	tests := []struct {
		name  string
		files []entity.File
		want  []string
	}{
		{
			name:  "empty files",
			files: []entity.File{},
			want:  []string{},
		},
		{
			name:  "nil files",
			files: nil,
			want:  []string{},
		},
		{
			name: "single file",
			files: []entity.File{
				{ObjectKey: "uploads/image1.jpg"},
			},
			want: []string{"uploads/image1.jpg"},
		},
		{
			name: "multiple files",
			files: []entity.File{
				{ObjectKey: "uploads/image1.jpg"},
				{ObjectKey: "uploads/image2.png"},
				{ObjectKey: "uploads/image3.gif"},
			},
			want: []string{"uploads/image1.jpg", "uploads/image2.png", "uploads/image3.gif"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractImageUrls(tt.files)

			if len(got) != len(tt.want) {
				t.Errorf("len(extractImageUrls) = %v, want %v", len(got), len(tt.want))
				return
			}

			for i, url := range got {
				if url != tt.want[i] {
					t.Errorf("extractImageUrls[%d] = %v, want %v", i, url, tt.want[i])
				}
			}

			// Verify it returns empty slice, not nil
			if tt.want != nil && len(tt.want) == 0 && got == nil {
				t.Error("expected empty slice, got nil")
			}
		})
	}
}

// testIDCollector is a generic helper for testing ID collection functions.
// It reduces duplication between TestCollectMenuIDs and TestCollectFileIDs.
func testIDCollector[T any](t *testing.T, funcName string, collectFn func([]T) []string, testCases []struct {
	name  string
	items []T
	want  []string
},
) {
	t.Helper()
	for _, tt := range testCases {
		t.Run(tt.name, func(t *testing.T) {
			got := collectFn(tt.items)
			if len(got) != len(tt.want) {
				t.Errorf("len(%s) = %v, want %v", funcName, len(got), len(tt.want))
				return
			}
			for i, id := range got {
				if id != tt.want[i] {
					t.Errorf("%s[%d] = %v, want %v", funcName, i, id, tt.want[i])
				}
			}
		})
	}
}

// Tests for collectMenuIDs

func TestCollectMenuIDs(t *testing.T) {
	testCases := []struct {
		name  string
		items []entity.Menu
		want  []string
	}{
		{name: "empty menus", items: []entity.Menu{}, want: []string{}},
		{name: "single menu", items: []entity.Menu{{MenuID: "menu-001"}}, want: []string{"menu-001"}},
		{name: "multiple menus", items: []entity.Menu{{MenuID: "menu-001"}, {MenuID: "menu-002"}, {MenuID: "menu-003"}}, want: []string{"menu-001", "menu-002", "menu-003"}},
	}
	testIDCollector(t, "collectMenuIDs", collectMenuIDs, testCases)
}

// Tests for collectFileIDs

func TestCollectFileIDs(t *testing.T) {
	testCases := []struct {
		name  string
		items []entity.File
		want  []string
	}{
		{name: "empty files", items: []entity.File{}, want: []string{}},
		{name: "single file", items: []entity.File{{FileID: "file-001"}}, want: []string{"file-001"}},
		{name: "multiple files", items: []entity.File{{FileID: "file-001"}, {FileID: "file-002"}, {FileID: "file-003"}}, want: []string{"file-001", "file-002", "file-003"}},
	}
	testIDCollector(t, "collectFileIDs", collectFileIDs, testCases)
}

// Tests for toResponses generic function

func TestToResponses(t *testing.T) {
	t.Run("empty slice returns empty slice not nil", func(t *testing.T) {
		stores := []entity.Store{}
		got := NewStoreResponses(stores)
		if got == nil {
			t.Error("expected empty slice, got nil")
		}
		if len(got) != 0 {
			t.Errorf("expected empty slice, got length %d", len(got))
		}
	})

	t.Run("preserves order", func(t *testing.T) {
		menus := []entity.Menu{
			{MenuID: "first", Name: "First Menu", StoreID: "store-1", CreatedAt: testTime()},
			{MenuID: "second", Name: "Second Menu", StoreID: "store-1", CreatedAt: testTime()},
			{MenuID: "third", Name: "Third Menu", StoreID: "store-1", CreatedAt: testTime()},
		}
		got := NewMenuResponses(menus)

		if len(got) != 3 {
			t.Fatalf("expected 3 responses, got %d", len(got))
		}
		if got[0].MenuID != "first" {
			t.Errorf("expected first element to have MenuID 'first', got %s", got[0].MenuID)
		}
		if got[1].MenuID != "second" {
			t.Errorf("expected second element to have MenuID 'second', got %s", got[1].MenuID)
		}
		if got[2].MenuID != "third" {
			t.Errorf("expected third element to have MenuID 'third', got %s", got[2].MenuID)
		}
	})
}

// Additional edge case tests

func TestStoreResponseImageUrlsAndTagsNeverNil(t *testing.T) {
	tests := []struct {
		name  string
		store entity.Store
	}{
		{
			name: "nil tags and nil files",
			store: entity.Store{
				StoreID:   "store-1",
				Name:      "Test",
				Address:   "Addr",
				PlaceID:   "place-1",
				Category:  "cafe",
				Budget:    "low",
				Tags:      nil,
				Files:     nil,
				CreatedAt: testTime(),
				UpdatedAt: testTimeUpdated(),
			},
		},
		{
			name: "empty tags and empty files",
			store: entity.Store{
				StoreID:   "store-2",
				Name:      "Test2",
				Address:   "Addr2",
				PlaceID:   "place-2",
				Category:  "cafe",
				Budget:    "low",
				Tags:      []string{},
				Files:     []entity.File{},
				CreatedAt: testTime(),
				UpdatedAt: testTimeUpdated(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewStoreResponse(tt.store)

			if got.Tags == nil {
				t.Error("Tags should never be nil")
			}
			if got.ImageUrls == nil {
				t.Error("ImageUrls should never be nil")
			}
		})
	}
}

func TestReviewResponseWithOnlyMenus(t *testing.T) {
	review := entity.Review{
		ReviewID:  "review-1",
		StoreID:   "store-1",
		UserID:    "user-1",
		Rating:    4,
		Menus:     []entity.Menu{createFullMenu()},
		Files:     nil,
		CreatedAt: testTime(),
	}

	got := NewReviewResponse(review)

	if len(got.Menus) != 1 {
		t.Errorf("expected 1 menu, got %d", len(got.Menus))
	}
	if len(got.MenuIDs) != 1 {
		t.Errorf("expected 1 menu ID, got %d", len(got.MenuIDs))
	}
	if got.Files != nil {
		t.Errorf("expected nil files, got %v", got.Files)
	}
	if got.FileIDs != nil {
		t.Errorf("expected nil file IDs, got %v", got.FileIDs)
	}
}

func TestReviewResponseWithOnlyFiles(t *testing.T) {
	review := entity.Review{
		ReviewID:  "review-1",
		StoreID:   "store-1",
		UserID:    "user-1",
		Rating:    4,
		Menus:     nil,
		Files:     []entity.File{createFullFile()},
		CreatedAt: testTime(),
	}

	got := NewReviewResponse(review)

	if got.Menus != nil {
		t.Errorf("expected nil menus, got %v", got.Menus)
	}
	if got.MenuIDs != nil {
		t.Errorf("expected nil menu IDs, got %v", got.MenuIDs)
	}
	if len(got.Files) != 1 {
		t.Errorf("expected 1 file, got %d", len(got.Files))
	}
	if len(got.FileIDs) != 1 {
		t.Errorf("expected 1 file ID, got %d", len(got.FileIDs))
	}
}
