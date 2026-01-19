package testutil

import (
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

const (
	customStoreID = "custom-store"
	customUserID  = "custom-user"
)

func TestNewTestUser(t *testing.T) {
	user := NewTestUser()
	if user.UserID != "test-user-id" {
		t.Errorf("UserID = %q, want %q", user.UserID, "test-user-id")
	}
	if user.Name != "Test User" {
		t.Errorf("Name = %q, want %q", user.Name, "Test User")
	}
}

func TestNewTestUser_WithOverrides(t *testing.T) {
	user := NewTestUser(
		WithUserID("custom-id"),
		WithUserName("Custom Name"),
		WithUserEmail("custom@example.com"),
		WithUserRole("admin"),
		WithUserProvider("github"),
	)
	if user.UserID != "custom-id" {
		t.Errorf("UserID = %q, want %q", user.UserID, "custom-id")
	}
	if user.Name != "Custom Name" {
		t.Errorf("Name = %q, want %q", user.Name, "Custom Name")
	}
	if user.Email != "custom@example.com" {
		t.Errorf("Email = %q, want %q", user.Email, "custom@example.com")
	}
	if user.Role != "admin" {
		t.Errorf("Role = %q, want %q", user.Role, "admin")
	}
	if user.Provider != "github" {
		t.Errorf("Provider = %q, want %q", user.Provider, "github")
	}
}

func TestNewTestStore(t *testing.T) {
	store := NewTestStore()
	if store.StoreID != "test-store-id" {
		t.Errorf("StoreID = %q, want %q", store.StoreID, "test-store-id")
	}
	if store.Name != "Test Store" {
		t.Errorf("Name = %q, want %q", store.Name, "Test Store")
	}
}

func TestNewTestStore_WithOverrides(t *testing.T) {
	store := NewTestStore(
		WithStoreID(customStoreID),
		WithStoreName("Custom Store"),
		WithStoreAddress("Custom Address"),
		WithStoreApproved(false),
		WithStoreCategory("Restaurant"),
		WithStoreLocation(40.7128, -74.0060),
		WithStoreTags([]string{"tag1", "tag2"}),
	)
	if store.StoreID != customStoreID {
		t.Errorf("StoreID = %q, want %q", store.StoreID, customStoreID)
	}
	if store.Name != "Custom Store" {
		t.Errorf("Name = %q, want %q", store.Name, "Custom Store")
	}
	if store.Address != "Custom Address" {
		t.Errorf("Address = %q, want %q", store.Address, "Custom Address")
	}
	if store.IsApproved {
		t.Error("IsApproved should be false")
	}
	if store.Category != "Restaurant" {
		t.Errorf("Category = %q, want %q", store.Category, "Restaurant")
	}
	if store.Latitude != 40.7128 {
		t.Errorf("Latitude = %f, want %f", store.Latitude, 40.7128)
	}
	if len(store.Tags) != 2 {
		t.Errorf("Tags len = %d, want %d", len(store.Tags), 2)
	}
}

func TestNewTestReview(t *testing.T) {
	review := NewTestReview()
	if review.ReviewID != "test-review-id" {
		t.Errorf("ReviewID = %q, want %q", review.ReviewID, "test-review-id")
	}
	if review.Rating != 4 {
		t.Errorf("Rating = %d, want %d", review.Rating, 4)
	}
}

func TestNewTestReview_WithOverrides(t *testing.T) {
	review := NewTestReview(
		WithReviewID("custom-review"),
		WithReviewStoreID(customStoreID),
		WithReviewUserID(customUserID),
		WithReviewRating(5),
		WithReviewContent("Great!"),
		WithReviewLikesCount(10),
	)
	if review.ReviewID != "custom-review" {
		t.Errorf("ReviewID = %q, want %q", review.ReviewID, "custom-review")
	}
	if review.StoreID != customStoreID {
		t.Errorf("StoreID = %q, want %q", review.StoreID, customStoreID)
	}
	if review.UserID != customUserID {
		t.Errorf("UserID = %q, want %q", review.UserID, customUserID)
	}
	if review.Rating != 5 {
		t.Errorf("Rating = %d, want %d", review.Rating, 5)
	}
	if review.Content == nil || *review.Content != "Great!" {
		t.Error("Content not set correctly")
	}
	if review.LikesCount != 10 {
		t.Errorf("LikesCount = %d, want %d", review.LikesCount, 10)
	}
}

func TestNewTestFavorite(t *testing.T) {
	favorite := NewTestFavorite()
	if favorite.UserID != "test-user-id" {
		t.Errorf("UserID = %q, want %q", favorite.UserID, "test-user-id")
	}
	if favorite.StoreID != "test-store-id" {
		t.Errorf("StoreID = %q, want %q", favorite.StoreID, "test-store-id")
	}
}

func TestNewTestFavorite_WithOverrides(t *testing.T) {
	store := &entity.Store{StoreID: customStoreID, Name: "Custom Store"}
	favorite := NewTestFavorite(
		WithFavoriteUserID(customUserID),
		WithFavoriteStoreID(customStoreID),
		WithFavoriteStore(store),
	)
	if favorite.UserID != customUserID {
		t.Errorf("UserID = %q, want %q", favorite.UserID, customUserID)
	}
	if favorite.StoreID != customStoreID {
		t.Errorf("StoreID = %q, want %q", favorite.StoreID, customStoreID)
	}
	if favorite.Store == nil || favorite.Store.Name != "Custom Store" {
		t.Error("Store not set correctly")
	}
}

func TestNewTestMenu(t *testing.T) {
	menu := NewTestMenu()
	if menu.MenuID != "test-menu-id" {
		t.Errorf("MenuID = %q, want %q", menu.MenuID, "test-menu-id")
	}
	if menu.Name != "Test Menu Item" {
		t.Errorf("Name = %q, want %q", menu.Name, "Test Menu Item")
	}
}

func TestNewTestMenu_WithOverrides(t *testing.T) {
	menu := NewTestMenu(
		WithMenuID("custom-menu"),
		WithMenuStoreID(customStoreID),
		WithMenuName("Custom Menu"),
		WithMenuPrice(1500),
		WithMenuDescription("Delicious item"),
	)
	if menu.MenuID != "custom-menu" {
		t.Errorf("MenuID = %q, want %q", menu.MenuID, "custom-menu")
	}
	if menu.StoreID != customStoreID {
		t.Errorf("StoreID = %q, want %q", menu.StoreID, customStoreID)
	}
	if menu.Name != "Custom Menu" {
		t.Errorf("Name = %q, want %q", menu.Name, "Custom Menu")
	}
	if menu.Price == nil || *menu.Price != 1500 {
		t.Error("Price not set correctly")
	}
	if menu.Description == nil || *menu.Description != "Delicious item" {
		t.Error("Description not set correctly")
	}
}

func TestNewTestReport(t *testing.T) {
	report := NewTestReport()
	if report.ReportID != 1 {
		t.Errorf("ReportID = %d, want %d", report.ReportID, 1)
	}
	if report.Status != "pending" {
		t.Errorf("Status = %q, want %q", report.Status, "pending")
	}
}

func TestNewTestReport_WithOverrides(t *testing.T) {
	report := NewTestReport(
		WithReportID(100),
		WithReportUserID(customUserID),
		WithReportTargetType("store"),
		WithReportTargetID(200),
		WithReportReason("inappropriate"),
		WithReportStatus("resolved"),
	)
	if report.ReportID != 100 {
		t.Errorf("ReportID = %d, want %d", report.ReportID, 100)
	}
	if report.UserID != customUserID {
		t.Errorf("UserID = %q, want %q", report.UserID, customUserID)
	}
	if report.TargetType != "store" {
		t.Errorf("TargetType = %q, want %q", report.TargetType, "store")
	}
	if report.TargetID != 200 {
		t.Errorf("TargetID = %d, want %d", report.TargetID, 200)
	}
	if report.Reason != "inappropriate" {
		t.Errorf("Reason = %q, want %q", report.Reason, "inappropriate")
	}
	if report.Status != "resolved" {
		t.Errorf("Status = %q, want %q", report.Status, "resolved")
	}
}

func TestNewTestFile(t *testing.T) {
	file := NewTestFile()
	if file.FileID != "test-file-id" {
		t.Errorf("FileID = %q, want %q", file.FileID, "test-file-id")
	}
	if file.FileKind != "image" {
		t.Errorf("FileKind = %q, want %q", file.FileKind, "image")
	}
}

func TestNewTestFile_WithOverrides(t *testing.T) {
	file := NewTestFile(
		WithFileID("custom-file"),
		WithFileKind("document"),
		WithFileName("doc.pdf"),
		WithFileSize(1024),
		WithFileContentType("application/pdf"),
		WithFileDeleted(true),
	)
	if file.FileID != "custom-file" {
		t.Errorf("FileID = %q, want %q", file.FileID, "custom-file")
	}
	if file.FileKind != "document" {
		t.Errorf("FileKind = %q, want %q", file.FileKind, "document")
	}
	if file.FileName != "doc.pdf" {
		t.Errorf("FileName = %q, want %q", file.FileName, "doc.pdf")
	}
	if file.FileSize == nil || *file.FileSize != 1024 {
		t.Error("FileSize not set correctly")
	}
	if file.ContentType == nil || *file.ContentType != "application/pdf" {
		t.Error("ContentType not set correctly")
	}
	if !file.IsDeleted {
		t.Error("IsDeleted should be true")
	}
}
