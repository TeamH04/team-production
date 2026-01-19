package main

import (
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
)

func TestBuildRouterDependencies(t *testing.T) {
	// Create in-memory SQLite database for testing
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Create test config
	cfg := &config.Config{
		Port:                   "8080",
		DBURL:                  "sqlite::memory:",
		SupabaseURL:            "https://test.supabase.co",
		SupabasePublishableKey: "test-publishable-key",
		SupabaseSecretKey:      "test-secret-key",
		SupabaseStorageBucket:  "test-bucket",
	}

	// Should not panic
	deps := buildRouterDependencies(cfg, db)

	// Verify dependencies are created
	if deps == nil {
		t.Fatal("buildRouterDependencies returned nil")
	}
	if deps.StoreHandler == nil {
		t.Error("StoreHandler is nil")
	}
	if deps.MenuHandler == nil {
		t.Error("MenuHandler is nil")
	}
	if deps.ReviewHandler == nil {
		t.Error("ReviewHandler is nil")
	}
	if deps.UserHandler == nil {
		t.Error("UserHandler is nil")
	}
	if deps.FavoriteHandler == nil {
		t.Error("FavoriteHandler is nil")
	}
	if deps.ReportHandler == nil {
		t.Error("ReportHandler is nil")
	}
	if deps.AuthHandler == nil {
		t.Error("AuthHandler is nil")
	}
	if deps.AdminHandler == nil {
		t.Error("AdminHandler is nil")
	}
	if deps.MediaHandler == nil {
		t.Error("MediaHandler is nil")
	}
	if deps.TokenVerifier == nil {
		t.Error("TokenVerifier is nil")
	}
	if deps.UserUC == nil {
		t.Error("UserUC is nil")
	}
}
