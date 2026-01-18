package model

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
)

// Helper function to create string pointer
func strPtr(s string) *string {
	return &s
}

// Helper function to create int pointer
func intPtr(i int) *int {
	return &i
}

// Helper function to create int64 pointer
func int64Ptr(i int64) *int64 {
	return &i
}

// assertStoreFields compares all fields of two Store entities
func assertStoreFields(t *testing.T, expected, result entity.Store) {
	t.Helper()

	// Basic fields
	assert.Equal(t, expected.StoreID, result.StoreID, "StoreID mismatch")
	assert.Equal(t, expected.Name, result.Name, "Name mismatch")
	assert.Equal(t, expected.Address, result.Address, "Address mismatch")
	assert.Equal(t, expected.PlaceID, result.PlaceID, "PlaceID mismatch")
	assert.Equal(t, expected.Latitude, result.Latitude, "Latitude mismatch")
	assert.Equal(t, expected.Longitude, result.Longitude, "Longitude mismatch")
	assert.Equal(t, expected.IsApproved, result.IsApproved, "IsApproved mismatch")
	assert.Equal(t, expected.Category, result.Category, "Category mismatch")
	assert.Equal(t, expected.Budget, result.Budget, "Budget mismatch")
	assert.Equal(t, expected.AverageRating, result.AverageRating, "AverageRating mismatch")
	assert.Equal(t, expected.DistanceMinutes, result.DistanceMinutes, "DistanceMinutes mismatch")

	// Pointer fields
	assert.Equal(t, expected.ThumbnailFileID, result.ThumbnailFileID, "ThumbnailFileID mismatch")
	assert.Equal(t, expected.Description, result.Description, "Description mismatch")
	assert.Equal(t, expected.OpeningHours, result.OpeningHours, "OpeningHours mismatch")
	assert.Equal(t, expected.GoogleMapURL, result.GoogleMapURL, "GoogleMapURL mismatch")

	// ThumbnailFile
	if expected.ThumbnailFile == nil {
		assert.Nil(t, result.ThumbnailFile, "ThumbnailFile should be nil")
	} else {
		require.NotNil(t, result.ThumbnailFile, "ThumbnailFile should not be nil")
		assert.Equal(t, expected.ThumbnailFile.FileID, result.ThumbnailFile.FileID, "ThumbnailFile.FileID mismatch")
	}

	// Slice lengths
	assert.Len(t, result.Tags, len(expected.Tags), "Tags length mismatch")
	assert.Len(t, result.Files, len(expected.Files), "Files length mismatch")
	assert.Len(t, result.Menus, len(expected.Menus), "Menus length mismatch")
	assert.Len(t, result.Reviews, len(expected.Reviews), "Reviews length mismatch")

	// Timestamps
	assert.True(t, result.CreatedAt.Equal(expected.CreatedAt), "CreatedAt mismatch")
	assert.True(t, result.UpdatedAt.Equal(expected.UpdatedAt), "UpdatedAt mismatch")
}

// assertUserFields compares all fields of two User entities
func assertUserFields(t *testing.T, expected, result entity.User) {
	t.Helper()

	assert.Equal(t, expected.UserID, result.UserID, "UserID mismatch")
	assert.Equal(t, expected.Name, result.Name, "Name mismatch")
	assert.Equal(t, expected.Email, result.Email, "Email mismatch")
	assert.Equal(t, expected.Provider, result.Provider, "Provider mismatch")
	assert.Equal(t, expected.Role, result.Role, "Role mismatch")
	assert.Equal(t, expected.IconURL, result.IconURL, "IconURL mismatch")
	assert.Equal(t, expected.IconFileID, result.IconFileID, "IconFileID mismatch")
	assert.Equal(t, expected.Gender, result.Gender, "Gender mismatch")

	if expected.Birthday == nil {
		assert.Nil(t, result.Birthday, "Birthday should be nil")
	} else {
		require.NotNil(t, result.Birthday, "Birthday should not be nil")
		assert.True(t, result.Birthday.Equal(*expected.Birthday), "Birthday mismatch")
	}

	assert.True(t, result.CreatedAt.Equal(expected.CreatedAt), "CreatedAt mismatch")
	assert.True(t, result.UpdatedAt.Equal(expected.UpdatedAt), "UpdatedAt mismatch")
}

// assertReviewFields compares all fields of two Review entities
func assertReviewFields(t *testing.T, expected, result entity.Review) {
	t.Helper()

	assert.Equal(t, expected.ReviewID, result.ReviewID, "ReviewID mismatch")
	assert.Equal(t, expected.StoreID, result.StoreID, "StoreID mismatch")
	assert.Equal(t, expected.UserID, result.UserID, "UserID mismatch")
	assert.Equal(t, expected.Rating, result.Rating, "Rating mismatch")
	assert.Equal(t, expected.Content, result.Content, "Content mismatch")
	assert.Len(t, result.Menus, len(expected.Menus), "Menus length mismatch")
	assert.Len(t, result.Files, len(expected.Files), "Files length mismatch")
	assert.True(t, result.CreatedAt.Equal(expected.CreatedAt), "CreatedAt mismatch")
}

// assertFileFields compares all fields of two File entities
func assertFileFields(t *testing.T, expected, result entity.File) {
	t.Helper()

	assert.Equal(t, expected.FileID, result.FileID, "FileID mismatch")
	assert.Equal(t, expected.FileKind, result.FileKind, "FileKind mismatch")
	assert.Equal(t, expected.FileName, result.FileName, "FileName mismatch")
	assert.Equal(t, expected.ObjectKey, result.ObjectKey, "ObjectKey mismatch")
	assert.Equal(t, expected.IsDeleted, result.IsDeleted, "IsDeleted mismatch")
	assert.Equal(t, expected.FileSize, result.FileSize, "FileSize mismatch")
	assert.Equal(t, expected.ContentType, result.ContentType, "ContentType mismatch")
	assert.Equal(t, expected.CreatedBy, result.CreatedBy, "CreatedBy mismatch")
	assert.True(t, result.CreatedAt.Equal(expected.CreatedAt), "CreatedAt mismatch")
}

// assertFavoriteFields compares all fields of two Favorite entities
func assertFavoriteFields(t *testing.T, expected, result entity.Favorite) {
	t.Helper()

	assert.Equal(t, expected.UserID, result.UserID, "UserID mismatch")
	assert.Equal(t, expected.StoreID, result.StoreID, "StoreID mismatch")
	assert.True(t, result.CreatedAt.Equal(expected.CreatedAt), "CreatedAt mismatch")

	if expected.Store == nil {
		assert.Nil(t, result.Store, "Store should be nil")
	} else {
		require.NotNil(t, result.Store, "Store should not be nil")
		assert.Equal(t, expected.Store.StoreID, result.Store.StoreID, "Store.StoreID mismatch")
		assert.Equal(t, expected.Store.Name, result.Store.Name, "Store.Name mismatch")
	}
}

// assertReportFields compares all fields of two Report entities
func assertReportFields(t *testing.T, expected, result entity.Report) {
	t.Helper()

	assert.Equal(t, expected.ReportID, result.ReportID, "ReportID mismatch")
	assert.Equal(t, expected.UserID, result.UserID, "UserID mismatch")
	assert.Equal(t, expected.TargetType, result.TargetType, "TargetType mismatch")
	assert.Equal(t, expected.TargetID, result.TargetID, "TargetID mismatch")
	assert.Equal(t, expected.Reason, result.Reason, "Reason mismatch")
	assert.Equal(t, expected.Status, result.Status, "Status mismatch")
	assert.True(t, result.CreatedAt.Equal(expected.CreatedAt), "CreatedAt mismatch")
	assert.True(t, result.UpdatedAt.Equal(expected.UpdatedAt), "UpdatedAt mismatch")
}

func TestStore_Entity(t *testing.T) {
	now := time.Now()
	openedAt := now.Add(-24 * time.Hour)

	tests := []struct {
		name     string
		model    Store
		expected entity.Store
	}{
		{
			name: "full model with all fields populated",
			model: Store{
				StoreID:         "store-123",
				ThumbnailFileID: strPtr("file-thumb-1"),
				Name:            "Test Store",
				OpenedAt:        &openedAt,
				Description:     strPtr("A test store description"),
				Address:         "123 Test Street",
				OpeningHours:    strPtr("9:00-18:00"),
				Latitude:        35.6762,
				Longitude:       139.6503,
				GoogleMapURL:    strPtr("https://maps.google.com/test"),
				PlaceID:         "place-123",
				IsApproved:      true,
				Category:        "カフェ・喫茶",
				Budget:          "$$",
				AverageRating:   4.5,
				DistanceMinutes: 10,
				CreatedAt:       now,
				UpdatedAt:       now,
				ThumbnailFile: &File{
					FileID:    "file-thumb-1",
					FileKind:  "image",
					FileName:  "thumb.jpg",
					ObjectKey: "stores/thumb.jpg",
					CreatedAt: now,
				},
				Tags: []StoreTag{
					{StoreID: "store-123", Tag: "wifi"},
					{StoreID: "store-123", Tag: "quiet"},
				},
				Files: []File{
					{FileID: "file-1", FileKind: "image", FileName: "photo1.jpg", ObjectKey: "stores/photo1.jpg", CreatedAt: now},
				},
				Menus: []Menu{
					{MenuID: "menu-1", StoreID: "store-123", Name: "Coffee", Price: intPtr(500), CreatedAt: now},
				},
				Reviews: []Review{
					{ReviewID: "review-1", StoreID: "store-123", UserID: "user-1", Rating: 5, CreatedAt: now},
				},
			},
			expected: entity.Store{
				StoreID:         "store-123",
				ThumbnailFileID: strPtr("file-thumb-1"),
				ThumbnailFile: &entity.File{
					FileID:    "file-thumb-1",
					FileKind:  "image",
					FileName:  "thumb.jpg",
					ObjectKey: "stores/thumb.jpg",
					CreatedAt: now,
				},
				Name:            "Test Store",
				OpenedAt:        &openedAt,
				Description:     strPtr("A test store description"),
				Address:         "123 Test Street",
				PlaceID:         "place-123",
				OpeningHours:    strPtr("9:00-18:00"),
				Latitude:        35.6762,
				Longitude:       139.6503,
				GoogleMapURL:    strPtr("https://maps.google.com/test"),
				IsApproved:      true,
				Category:        "カフェ・喫茶",
				Budget:          "$$",
				AverageRating:   4.5,
				DistanceMinutes: 10,
				Tags:            []string{"wifi", "quiet"},
				Files: []entity.File{
					{FileID: "file-1", FileKind: "image", FileName: "photo1.jpg", ObjectKey: "stores/photo1.jpg", CreatedAt: now},
				},
				CreatedAt: now,
				UpdatedAt: now,
				Menus: []entity.Menu{
					{MenuID: "menu-1", StoreID: "store-123", Name: "Coffee", Price: intPtr(500), CreatedAt: now},
				},
				Reviews: []entity.Review{
					{ReviewID: "review-1", StoreID: "store-123", UserID: "user-1", Rating: 5, CreatedAt: now},
				},
			},
		},
		{
			name: "minimal model with required fields only",
			model: Store{
				StoreID:   "store-minimal",
				Name:      "Minimal Store",
				Address:   "Minimal Address",
				PlaceID:   "place-minimal",
				Latitude:  0,
				Longitude: 0,
				CreatedAt: now,
				UpdatedAt: now,
			},
			expected: entity.Store{
				StoreID:       "store-minimal",
				Name:          "Minimal Store",
				Address:       "Minimal Address",
				PlaceID:       "place-minimal",
				Latitude:      0,
				Longitude:     0,
				CreatedAt:     now,
				UpdatedAt:     now,
				Tags:          []string{},
				Files:         []entity.File{},
				Menus:         []entity.Menu{},
				Reviews:       []entity.Review{},
				ThumbnailFile: nil,
			},
		},
		{
			name: "model with nil optional fields",
			model: Store{
				StoreID:         "store-nil",
				ThumbnailFileID: nil,
				Name:            "Nil Fields Store",
				OpenedAt:        nil,
				Description:     nil,
				Address:         "Address",
				OpeningHours:    nil,
				GoogleMapURL:    nil,
				PlaceID:         "place-nil",
				ThumbnailFile:   nil,
				Tags:            nil,
				Files:           nil,
				Menus:           nil,
				Reviews:         nil,
				CreatedAt:       now,
				UpdatedAt:       now,
			},
			expected: entity.Store{
				StoreID:         "store-nil",
				ThumbnailFileID: nil,
				ThumbnailFile:   nil,
				Name:            "Nil Fields Store",
				OpenedAt:        nil,
				Description:     nil,
				Address:         "Address",
				OpeningHours:    nil,
				GoogleMapURL:    nil,
				PlaceID:         "place-nil",
				Tags:            []string{},
				Files:           []entity.File{},
				Menus:           []entity.Menu{},
				Reviews:         []entity.Review{},
				CreatedAt:       now,
				UpdatedAt:       now,
			},
		},
		{
			name: "model with empty slices",
			model: Store{
				StoreID:   "store-empty",
				Name:      "Empty Slices Store",
				Address:   "Address",
				PlaceID:   "place-empty",
				CreatedAt: now,
				UpdatedAt: now,
				Tags:      []StoreTag{},
				Files:     []File{},
				Menus:     []Menu{},
				Reviews:   []Review{},
			},
			expected: entity.Store{
				StoreID:   "store-empty",
				Name:      "Empty Slices Store",
				Address:   "Address",
				PlaceID:   "place-empty",
				CreatedAt: now,
				UpdatedAt: now,
				Tags:      []string{},
				Files:     []entity.File{},
				Menus:     []entity.Menu{},
				Reviews:   []entity.Review{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()
			assertStoreFields(t, tt.expected, result)
		})
	}
}

func TestMenu_Entity(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		model    Menu
		expected entity.Menu
	}{
		{
			name: "full menu with all fields",
			model: Menu{
				MenuID:      "menu-123",
				StoreID:     "store-123",
				Name:        "Latte",
				Price:       intPtr(500),
				Description: strPtr("A delicious latte"),
				CreatedAt:   now,
			},
			expected: entity.Menu{
				MenuID:      "menu-123",
				StoreID:     "store-123",
				Name:        "Latte",
				Price:       intPtr(500),
				Description: strPtr("A delicious latte"),
				CreatedAt:   now,
			},
		},
		{
			name: "menu with nil optional fields",
			model: Menu{
				MenuID:      "menu-minimal",
				StoreID:     "store-123",
				Name:        "Water",
				Price:       nil,
				Description: nil,
				CreatedAt:   now,
			},
			expected: entity.Menu{
				MenuID:      "menu-minimal",
				StoreID:     "store-123",
				Name:        "Water",
				Price:       nil,
				Description: nil,
				CreatedAt:   now,
			},
		},
		{
			name: "menu with zero price",
			model: Menu{
				MenuID:    "menu-free",
				StoreID:   "store-123",
				Name:      "Free Sample",
				Price:     intPtr(0),
				CreatedAt: now,
			},
			expected: entity.Menu{
				MenuID:    "menu-free",
				StoreID:   "store-123",
				Name:      "Free Sample",
				Price:     intPtr(0),
				CreatedAt: now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()

			assert.Equal(t, tt.expected.MenuID, result.MenuID, "MenuID mismatch")
			assert.Equal(t, tt.expected.StoreID, result.StoreID, "StoreID mismatch")
			assert.Equal(t, tt.expected.Name, result.Name, "Name mismatch")
			assert.Equal(t, tt.expected.Price, result.Price, "Price mismatch")
			assert.Equal(t, tt.expected.Description, result.Description, "Description mismatch")
			assert.True(t, result.CreatedAt.Equal(tt.expected.CreatedAt), "CreatedAt mismatch")
		})
	}
}

func TestReview_Entity(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		model    Review
		expected entity.Review
	}{
		{
			name: "full review with all fields",
			model: Review{
				ReviewID:  "review-123",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    5,
				Content:   strPtr("Great coffee!"),
				CreatedAt: now,
				Menus: []Menu{
					{MenuID: "menu-1", StoreID: "store-123", Name: "Latte", CreatedAt: now},
				},
				Files: []File{
					{FileID: "file-1", FileKind: "image", FileName: "photo.jpg", ObjectKey: "reviews/photo.jpg", CreatedAt: now},
				},
			},
			expected: entity.Review{
				ReviewID:  "review-123",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    5,
				Content:   strPtr("Great coffee!"),
				CreatedAt: now,
				Menus: []entity.Menu{
					{MenuID: "menu-1", StoreID: "store-123", Name: "Latte", CreatedAt: now},
				},
				Files: []entity.File{
					{FileID: "file-1", FileKind: "image", FileName: "photo.jpg", ObjectKey: "reviews/photo.jpg", CreatedAt: now},
				},
			},
		},
		{
			name: "review with nil content",
			model: Review{
				ReviewID:  "review-minimal",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    3,
				Content:   nil,
				CreatedAt: now,
			},
			expected: entity.Review{
				ReviewID:  "review-minimal",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    3,
				Content:   nil,
				CreatedAt: now,
				Menus:     []entity.Menu{},
				Files:     []entity.File{},
			},
		},
		{
			name: "review with empty slices",
			model: Review{
				ReviewID:  "review-empty",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    4,
				Content:   strPtr(""),
				CreatedAt: now,
				Menus:     []Menu{},
				Files:     []File{},
			},
			expected: entity.Review{
				ReviewID:  "review-empty",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    4,
				Content:   strPtr(""),
				CreatedAt: now,
				Menus:     []entity.Menu{},
				Files:     []entity.File{},
			},
		},
		{
			name: "review with minimum rating",
			model: Review{
				ReviewID:  "review-low",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    1,
				CreatedAt: now,
			},
			expected: entity.Review{
				ReviewID:  "review-low",
				StoreID:   "store-123",
				UserID:    "user-123",
				Rating:    1,
				CreatedAt: now,
				Menus:     []entity.Menu{},
				Files:     []entity.File{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()
			assertReviewFields(t, tt.expected, result)
		})
	}
}

func TestUser_Entity(t *testing.T) {
	now := time.Now()
	birthday := time.Date(1990, 1, 15, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name     string
		model    User
		expected entity.User
	}{
		{
			name: "full user with all fields",
			model: User{
				UserID:     "user-123",
				Name:       "John Doe",
				Email:      "john@example.com",
				IconURL:    strPtr("https://example.com/icon.png"),
				IconFileID: strPtr("file-icon-1"),
				Provider:   "google",
				Gender:     strPtr("male"),
				Birthday:   &birthday,
				Role:       role.Admin,
				CreatedAt:  now,
				UpdatedAt:  now,
			},
			expected: entity.User{
				UserID:     "user-123",
				Name:       "John Doe",
				Email:      "john@example.com",
				IconURL:    strPtr("https://example.com/icon.png"),
				IconFileID: strPtr("file-icon-1"),
				Provider:   "google",
				Gender:     strPtr("male"),
				Birthday:   &birthday,
				Role:       role.Admin,
				CreatedAt:  now,
				UpdatedAt:  now,
			},
		},
		{
			name: "user with empty provider defaults to email",
			model: User{
				UserID:    "user-email",
				Name:      "Email User",
				Email:     "email@example.com",
				Provider:  "",
				Role:      role.User,
				CreatedAt: now,
				UpdatedAt: now,
			},
			expected: entity.User{
				UserID:    "user-email",
				Name:      "Email User",
				Email:     "email@example.com",
				Provider:  "email",
				Role:      role.User,
				CreatedAt: now,
				UpdatedAt: now,
			},
		},
		{
			name: "user with empty role defaults to user role",
			model: User{
				UserID:    "user-default-role",
				Name:      "Default Role User",
				Email:     "default@example.com",
				Provider:  "google",
				Role:      "",
				CreatedAt: now,
				UpdatedAt: now,
			},
			expected: entity.User{
				UserID:    "user-default-role",
				Name:      "Default Role User",
				Email:     "default@example.com",
				Provider:  "google",
				Role:      role.User,
				CreatedAt: now,
				UpdatedAt: now,
			},
		},
		{
			name: "user with nil optional fields",
			model: User{
				UserID:     "user-minimal",
				Name:       "Minimal User",
				Email:      "minimal@example.com",
				IconURL:    nil,
				IconFileID: nil,
				Provider:   "apple",
				Gender:     nil,
				Birthday:   nil,
				Role:       role.User,
				CreatedAt:  now,
				UpdatedAt:  now,
			},
			expected: entity.User{
				UserID:     "user-minimal",
				Name:       "Minimal User",
				Email:      "minimal@example.com",
				IconURL:    nil,
				IconFileID: nil,
				Provider:   "apple",
				Gender:     nil,
				Birthday:   nil,
				Role:       role.User,
				CreatedAt:  now,
				UpdatedAt:  now,
			},
		},
		{
			name: "user with owner role",
			model: User{
				UserID:    "user-owner",
				Name:      "Owner User",
				Email:     "owner@example.com",
				Provider:  "google",
				Role:      role.Owner,
				CreatedAt: now,
				UpdatedAt: now,
			},
			expected: entity.User{
				UserID:    "user-owner",
				Name:      "Owner User",
				Email:     "owner@example.com",
				Provider:  "google",
				Role:      role.Owner,
				CreatedAt: now,
				UpdatedAt: now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()
			assertUserFields(t, tt.expected, result)
		})
	}
}

func TestFavorite_Entity(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		model    Favorite
		expected entity.Favorite
	}{
		{
			name: "favorite with store",
			model: Favorite{
				UserID:    "user-123",
				StoreID:   "store-123",
				CreatedAt: now,
				Store: &Store{
					StoreID:   "store-123",
					Name:      "Favorite Store",
					Address:   "123 Main St",
					PlaceID:   "place-123",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			expected: entity.Favorite{
				UserID:    "user-123",
				StoreID:   "store-123",
				CreatedAt: now,
				Store: &entity.Store{
					StoreID:   "store-123",
					Name:      "Favorite Store",
					Address:   "123 Main St",
					PlaceID:   "place-123",
					CreatedAt: now,
					UpdatedAt: now,
					Tags:      []string{},
					Files:     []entity.File{},
					Menus:     []entity.Menu{},
					Reviews:   []entity.Review{},
				},
			},
		},
		{
			name: "favorite without store (nil)",
			model: Favorite{
				UserID:    "user-456",
				StoreID:   "store-456",
				CreatedAt: now,
				Store:     nil,
			},
			expected: entity.Favorite{
				UserID:    "user-456",
				StoreID:   "store-456",
				CreatedAt: now,
				Store:     nil,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()
			assertFavoriteFields(t, tt.expected, result)
		})
	}
}

func TestFile_Entity(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		model    File
		expected entity.File
	}{
		{
			name: "full file with all fields",
			model: File{
				FileID:      "file-123",
				FileKind:    "image",
				FileName:    "photo.jpg",
				FileSize:    int64Ptr(1024),
				ObjectKey:   "uploads/photo.jpg",
				ContentType: strPtr("image/jpeg"),
				IsDeleted:   false,
				CreatedAt:   now,
				CreatedBy:   strPtr("user-123"),
			},
			expected: entity.File{
				FileID:      "file-123",
				FileKind:    "image",
				FileName:    "photo.jpg",
				FileSize:    int64Ptr(1024),
				ObjectKey:   "uploads/photo.jpg",
				ContentType: strPtr("image/jpeg"),
				IsDeleted:   false,
				CreatedAt:   now,
				CreatedBy:   strPtr("user-123"),
			},
		},
		{
			name: "file with nil optional fields",
			model: File{
				FileID:      "file-minimal",
				FileKind:    "document",
				FileName:    "doc.pdf",
				FileSize:    nil,
				ObjectKey:   "uploads/doc.pdf",
				ContentType: nil,
				IsDeleted:   false,
				CreatedAt:   now,
				CreatedBy:   nil,
			},
			expected: entity.File{
				FileID:      "file-minimal",
				FileKind:    "document",
				FileName:    "doc.pdf",
				FileSize:    nil,
				ObjectKey:   "uploads/doc.pdf",
				ContentType: nil,
				IsDeleted:   false,
				CreatedAt:   now,
				CreatedBy:   nil,
			},
		},
		{
			name: "deleted file",
			model: File{
				FileID:    "file-deleted",
				FileKind:  "image",
				FileName:  "deleted.jpg",
				ObjectKey: "uploads/deleted.jpg",
				IsDeleted: true,
				CreatedAt: now,
			},
			expected: entity.File{
				FileID:    "file-deleted",
				FileKind:  "image",
				FileName:  "deleted.jpg",
				ObjectKey: "uploads/deleted.jpg",
				IsDeleted: true,
				CreatedAt: now,
			},
		},
		{
			name: "file with zero size",
			model: File{
				FileID:    "file-empty",
				FileKind:  "text",
				FileName:  "empty.txt",
				FileSize:  int64Ptr(0),
				ObjectKey: "uploads/empty.txt",
				CreatedAt: now,
			},
			expected: entity.File{
				FileID:    "file-empty",
				FileKind:  "text",
				FileName:  "empty.txt",
				FileSize:  int64Ptr(0),
				ObjectKey: "uploads/empty.txt",
				CreatedAt: now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()
			assertFileFields(t, tt.expected, result)
		})
	}
}

func TestReport_Entity(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		model    Report
		expected entity.Report
	}{
		{
			name: "pending report",
			model: Report{
				ReportID:   1,
				UserID:     "user-123",
				TargetType: "review",
				TargetID:   100,
				Reason:     "spam",
				Status:     "pending",
				CreatedAt:  now,
				UpdatedAt:  now,
			},
			expected: entity.Report{
				ReportID:   1,
				UserID:     "user-123",
				TargetType: "review",
				TargetID:   100,
				Reason:     "spam",
				Status:     "pending",
				CreatedAt:  now,
				UpdatedAt:  now,
			},
		},
		{
			name: "resolved report",
			model: Report{
				ReportID:   2,
				UserID:     "user-456",
				TargetType: "store",
				TargetID:   200,
				Reason:     "inappropriate content",
				Status:     "resolved",
				CreatedAt:  now.Add(-24 * time.Hour),
				UpdatedAt:  now,
			},
			expected: entity.Report{
				ReportID:   2,
				UserID:     "user-456",
				TargetType: "store",
				TargetID:   200,
				Reason:     "inappropriate content",
				Status:     "resolved",
				CreatedAt:  now.Add(-24 * time.Hour),
				UpdatedAt:  now,
			},
		},
		{
			name: "rejected report",
			model: Report{
				ReportID:   3,
				UserID:     "user-789",
				TargetType: "review",
				TargetID:   300,
				Reason:     "false report",
				Status:     "rejected",
				CreatedAt:  now,
				UpdatedAt:  now,
			},
			expected: entity.Report{
				ReportID:   3,
				UserID:     "user-789",
				TargetType: "review",
				TargetID:   300,
				Reason:     "false report",
				Status:     "rejected",
				CreatedAt:  now,
				UpdatedAt:  now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.model.Entity()
			assertReportFields(t, tt.expected, result)
		})
	}
}

func TestToEntities(t *testing.T) {
	now := time.Now()

	t.Run("convert slice of menus", func(t *testing.T) {
		models := []Menu{
			{MenuID: "menu-1", StoreID: "store-1", Name: "Coffee", CreatedAt: now},
			{MenuID: "menu-2", StoreID: "store-1", Name: "Tea", CreatedAt: now},
			{MenuID: "menu-3", StoreID: "store-1", Name: "Juice", CreatedAt: now},
		}

		result := ToEntities[entity.Menu, Menu](models)

		require.Len(t, result, len(models), "length mismatch")
		for i, e := range result {
			assert.Equal(t, models[i].MenuID, e.MenuID, "index %d MenuID mismatch", i)
			assert.Equal(t, models[i].Name, e.Name, "index %d Name mismatch", i)
		}
	})

	t.Run("convert empty slice", func(t *testing.T) {
		models := []Menu{}
		result := ToEntities[entity.Menu, Menu](models)
		assert.Empty(t, result, "expected empty slice")
	})

	t.Run("convert slice of files", func(t *testing.T) {
		models := []File{
			{FileID: "file-1", FileKind: "image", FileName: "a.jpg", ObjectKey: "a.jpg", CreatedAt: now},
			{FileID: "file-2", FileKind: "image", FileName: "b.jpg", ObjectKey: "b.jpg", CreatedAt: now},
		}

		result := ToEntities[entity.File, File](models)

		require.Len(t, result, len(models), "length mismatch")
		for i, e := range result {
			assert.Equal(t, models[i].FileID, e.FileID, "index %d FileID mismatch", i)
		}
	})

	t.Run("convert slice of reviews", func(t *testing.T) {
		models := []Review{
			{ReviewID: "review-1", StoreID: "store-1", UserID: "user-1", Rating: 5, CreatedAt: now},
			{ReviewID: "review-2", StoreID: "store-1", UserID: "user-2", Rating: 4, CreatedAt: now},
		}

		result := ToEntities[entity.Review, Review](models)

		require.Len(t, result, len(models), "length mismatch")
		for i, e := range result {
			assert.Equal(t, models[i].ReviewID, e.ReviewID, "index %d ReviewID mismatch", i)
			assert.Equal(t, models[i].Rating, e.Rating, "index %d Rating mismatch", i)
		}
	})
}

func TestTableName(t *testing.T) {
	t.Run("StoreFile table name", func(t *testing.T) {
		sf := StoreFile{}
		assert.Equal(t, "store_files", sf.TableName())
	})

	t.Run("StoreTag table name", func(t *testing.T) {
		st := StoreTag{}
		assert.Equal(t, "store_tags", st.TableName())
	})

	t.Run("ReviewMenu table name", func(t *testing.T) {
		rm := ReviewMenu{}
		assert.Equal(t, "review_menus", rm.TableName())
	})

	t.Run("ReviewFile table name", func(t *testing.T) {
		rf := ReviewFile{}
		assert.Equal(t, "review_files", rf.TableName())
	})

	t.Run("ReviewLike table name", func(t *testing.T) {
		rl := ReviewLike{}
		assert.Equal(t, "review_likes", rl.TableName())
	})
}

func TestExtractTags(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		tags     []StoreTag
		expected []string
	}{
		{
			name: "multiple tags",
			tags: []StoreTag{
				{StoreID: "store-1", Tag: "wifi", CreatedAt: now},
				{StoreID: "store-1", Tag: "quiet", CreatedAt: now},
				{StoreID: "store-1", Tag: "outdoor", CreatedAt: now},
			},
			expected: []string{"wifi", "quiet", "outdoor"},
		},
		{
			name:     "empty tags",
			tags:     []StoreTag{},
			expected: []string{},
		},
		{
			name:     "nil tags",
			tags:     nil,
			expected: []string{},
		},
		{
			name: "single tag",
			tags: []StoreTag{
				{StoreID: "store-1", Tag: "pet-friendly", CreatedAt: now},
			},
			expected: []string{"pet-friendly"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractTags(tt.tags)

			require.Len(t, result, len(tt.expected), "length mismatch")
			for i, tag := range result {
				assert.Equal(t, tt.expected[i], tag, "index %d tag mismatch", i)
			}
		})
	}
}
