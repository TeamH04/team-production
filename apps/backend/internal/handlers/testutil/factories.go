package testutil

import (
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/constants"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
)

// TestTime is a fixed time used for deterministic test data.
// Using a fixed time ensures tests are reproducible and not flaky.
var TestTime = time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)

// --- Entity Factory Functions ---
// These functions create test entities with sensible default values.
// Override specific fields using the functional options pattern.

// NewTestUser creates a test user with default values.
// Override fields by passing functions that modify the user.
func NewTestUser(overrides ...func(*entity.User)) entity.User {
	user := entity.User{
		UserID:    "test-user-id",
		Name:      "Test User",
		Email:     "test@example.com",
		Provider:  constants.ProviderGoogle,
		Role:      role.User,
		CreatedAt: TestTime,
		UpdatedAt: TestTime,
	}
	for _, override := range overrides {
		override(&user)
	}
	return user
}

// WithUserID sets the user ID.
func WithUserID(id string) func(*entity.User) {
	return func(u *entity.User) {
		u.UserID = id
	}
}

// WithUserName sets the user name.
func WithUserName(name string) func(*entity.User) {
	return func(u *entity.User) {
		u.Name = name
	}
}

// WithUserEmail sets the user email.
func WithUserEmail(email string) func(*entity.User) {
	return func(u *entity.User) {
		u.Email = email
	}
}

// WithUserRole sets the user role.
func WithUserRole(role string) func(*entity.User) {
	return func(u *entity.User) {
		u.Role = role
	}
}

// WithUserProvider sets the user provider.
func WithUserProvider(provider string) func(*entity.User) {
	return func(u *entity.User) {
		u.Provider = provider
	}
}

// NewTestStore creates a test store with default values.
// Override fields by passing functions that modify the store.
func NewTestStore(overrides ...func(*entity.Store)) entity.Store {
	store := entity.Store{
		StoreID:         "test-store-id",
		Name:            "Test Store",
		Address:         "Test Address 123",
		PlaceID:         "test-place-id",
		Latitude:        35.6812,
		Longitude:       139.7671,
		IsApproved:      true,
		Category:        "Cafe",
		Budget:          "$$",
		AverageRating:   4.0,
		DistanceMinutes: 5,
		CreatedAt:       TestTime,
		UpdatedAt:       TestTime,
	}
	for _, override := range overrides {
		override(&store)
	}
	return store
}

// WithStoreID sets the store ID.
func WithStoreID(id string) func(*entity.Store) {
	return func(s *entity.Store) {
		s.StoreID = id
	}
}

// WithStoreName sets the store name.
func WithStoreName(name string) func(*entity.Store) {
	return func(s *entity.Store) {
		s.Name = name
	}
}

// WithStoreAddress sets the store address.
func WithStoreAddress(address string) func(*entity.Store) {
	return func(s *entity.Store) {
		s.Address = address
	}
}

// WithStoreApproved sets the store approval status.
func WithStoreApproved(approved bool) func(*entity.Store) {
	return func(s *entity.Store) {
		s.IsApproved = approved
	}
}

// WithStoreCategory sets the store category.
func WithStoreCategory(category string) func(*entity.Store) {
	return func(s *entity.Store) {
		s.Category = category
	}
}

// WithStoreLocation sets the store latitude and longitude.
func WithStoreLocation(lat, lng float64) func(*entity.Store) {
	return func(s *entity.Store) {
		s.Latitude = lat
		s.Longitude = lng
	}
}

// WithStoreTags sets the store tags.
func WithStoreTags(tags []string) func(*entity.Store) {
	return func(s *entity.Store) {
		s.Tags = tags
	}
}

// NewTestReview creates a test review with default values.
// Override fields by passing functions that modify the review.
func NewTestReview(overrides ...func(*entity.Review)) entity.Review {
	review := entity.Review{
		ReviewID:   "test-review-id",
		StoreID:    "test-store-id",
		UserID:     "test-user-id",
		Rating:     4,
		LikesCount: 0,
		LikedByMe:  false,
		CreatedAt:  TestTime,
	}
	for _, override := range overrides {
		override(&review)
	}
	return review
}

// WithReviewID sets the review ID.
func WithReviewID(id string) func(*entity.Review) {
	return func(r *entity.Review) {
		r.ReviewID = id
	}
}

// WithReviewStoreID sets the review store ID.
func WithReviewStoreID(storeID string) func(*entity.Review) {
	return func(r *entity.Review) {
		r.StoreID = storeID
	}
}

// WithReviewUserID sets the review user ID.
func WithReviewUserID(userID string) func(*entity.Review) {
	return func(r *entity.Review) {
		r.UserID = userID
	}
}

// WithReviewRating sets the review rating.
func WithReviewRating(rating int) func(*entity.Review) {
	return func(r *entity.Review) {
		r.Rating = rating
	}
}

// WithReviewContent sets the review content.
func WithReviewContent(content string) func(*entity.Review) {
	return func(r *entity.Review) {
		r.Content = &content
	}
}

// WithReviewLikesCount sets the review likes count.
func WithReviewLikesCount(count int) func(*entity.Review) {
	return func(r *entity.Review) {
		r.LikesCount = count
	}
}

// NewTestFavorite creates a test favorite with default values.
// Override fields by passing functions that modify the favorite.
func NewTestFavorite(overrides ...func(*entity.Favorite)) entity.Favorite {
	favorite := entity.Favorite{
		UserID:    "test-user-id",
		StoreID:   "test-store-id",
		CreatedAt: TestTime,
	}
	for _, override := range overrides {
		override(&favorite)
	}
	return favorite
}

// WithFavoriteUserID sets the favorite user ID.
func WithFavoriteUserID(userID string) func(*entity.Favorite) {
	return func(f *entity.Favorite) {
		f.UserID = userID
	}
}

// WithFavoriteStoreID sets the favorite store ID.
func WithFavoriteStoreID(storeID string) func(*entity.Favorite) {
	return func(f *entity.Favorite) {
		f.StoreID = storeID
	}
}

// WithFavoriteStore sets the associated store.
func WithFavoriteStore(store *entity.Store) func(*entity.Favorite) {
	return func(f *entity.Favorite) {
		f.Store = store
	}
}

// NewTestMenu creates a test menu with default values.
// Override fields by passing functions that modify the menu.
func NewTestMenu(overrides ...func(*entity.Menu)) entity.Menu {
	menu := entity.Menu{
		MenuID:    "test-menu-id",
		StoreID:   "test-store-id",
		Name:      "Test Menu Item",
		CreatedAt: TestTime,
	}
	for _, override := range overrides {
		override(&menu)
	}
	return menu
}

// WithMenuID sets the menu ID.
func WithMenuID(id string) func(*entity.Menu) {
	return func(m *entity.Menu) {
		m.MenuID = id
	}
}

// WithMenuStoreID sets the menu store ID.
func WithMenuStoreID(storeID string) func(*entity.Menu) {
	return func(m *entity.Menu) {
		m.StoreID = storeID
	}
}

// WithMenuName sets the menu name.
func WithMenuName(name string) func(*entity.Menu) {
	return func(m *entity.Menu) {
		m.Name = name
	}
}

// WithMenuPrice sets the menu price.
func WithMenuPrice(price int) func(*entity.Menu) {
	return func(m *entity.Menu) {
		m.Price = &price
	}
}

// WithMenuDescription sets the menu description.
func WithMenuDescription(description string) func(*entity.Menu) {
	return func(m *entity.Menu) {
		m.Description = &description
	}
}

// NewTestReport creates a test report with default values.
// Override fields by passing functions that modify the report.
func NewTestReport(overrides ...func(*entity.Report)) entity.Report {
	report := entity.Report{
		ReportID:   1,
		UserID:     "test-user-id",
		TargetType: constants.TargetTypeReview,
		TargetID:   1,
		Reason:     "spam",
		Status:     constants.ReportStatusPending,
		CreatedAt:  TestTime,
		UpdatedAt:  TestTime,
	}
	for _, override := range overrides {
		override(&report)
	}
	return report
}

// WithReportID sets the report ID.
func WithReportID(id int64) func(*entity.Report) {
	return func(r *entity.Report) {
		r.ReportID = id
	}
}

// WithReportUserID sets the report user ID.
func WithReportUserID(userID string) func(*entity.Report) {
	return func(r *entity.Report) {
		r.UserID = userID
	}
}

// WithReportTargetType sets the report target type.
func WithReportTargetType(targetType string) func(*entity.Report) {
	return func(r *entity.Report) {
		r.TargetType = targetType
	}
}

// WithReportTargetID sets the report target ID.
func WithReportTargetID(targetID int64) func(*entity.Report) {
	return func(r *entity.Report) {
		r.TargetID = targetID
	}
}

// WithReportReason sets the report reason.
func WithReportReason(reason string) func(*entity.Report) {
	return func(r *entity.Report) {
		r.Reason = reason
	}
}

// WithReportStatus sets the report status.
func WithReportStatus(status string) func(*entity.Report) {
	return func(r *entity.Report) {
		r.Status = status
	}
}

// NewTestFile creates a test file with default values.
// Override fields by passing functions that modify the file.
func NewTestFile(overrides ...func(*entity.File)) entity.File {
	file := entity.File{
		FileID:    "test-file-id",
		FileKind:  "image",
		FileName:  "test-image.jpg",
		ObjectKey: "uploads/test-image.jpg",
		IsDeleted: false,
		CreatedAt: TestTime,
	}
	for _, override := range overrides {
		override(&file)
	}
	return file
}

// WithFileID sets the file ID.
func WithFileID(id string) func(*entity.File) {
	return func(f *entity.File) {
		f.FileID = id
	}
}

// WithFileKind sets the file kind.
func WithFileKind(kind string) func(*entity.File) {
	return func(f *entity.File) {
		f.FileKind = kind
	}
}

// WithFileName sets the file name.
func WithFileName(name string) func(*entity.File) {
	return func(f *entity.File) {
		f.FileName = name
	}
}

// WithFileSize sets the file size.
func WithFileSize(size int64) func(*entity.File) {
	return func(f *entity.File) {
		f.FileSize = &size
	}
}

// WithFileContentType sets the file content type.
func WithFileContentType(contentType string) func(*entity.File) {
	return func(f *entity.File) {
		f.ContentType = &contentType
	}
}

// WithFileDeleted sets the file deleted status.
func WithFileDeleted(deleted bool) func(*entity.File) {
	return func(f *entity.File) {
		f.IsDeleted = deleted
	}
}
