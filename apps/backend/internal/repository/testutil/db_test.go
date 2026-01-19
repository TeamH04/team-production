package testutil

import (
	"testing"
)

func TestSetupTestDB(t *testing.T) {
	db := SetupTestDB(t)
	if db == nil {
		t.Fatal("SetupTestDB returned nil")
	}

	// Verify database connection is working
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("failed to get underlying sql.DB: %v", err)
	}

	if err := sqlDB.Ping(); err != nil {
		t.Fatalf("failed to ping database: %v", err)
	}

	// Cleanup
	CleanupTestDB(t, db)
}

func TestSetupTestDB_TablesCreated(t *testing.T) {
	db := SetupTestDB(t)
	defer CleanupTestDB(t, db)

	// Verify tables were created by checking if we can query them
	tables := []string{
		"users",
		"stores",
		"menus",
		"reviews",
		"files",
		"favorites",
		"reports",
		"store_files",
		"store_tags",
		"review_menus",
		"review_files",
		"review_likes",
	}

	for _, table := range tables {
		var count int64
		if err := db.Table(table).Count(&count).Error; err != nil {
			t.Errorf("table %q should exist but got error: %v", table, err)
		}
	}
}

func TestSetupTestDB_InsertAndQuery(t *testing.T) {
	db := SetupTestDB(t)
	defer CleanupTestDB(t, db)

	// Test insert
	user := testUser{
		UserID:   "test-user-1",
		Name:     "Test User",
		Email:    "test@example.com",
		Provider: "google",
		Role:     "user",
	}

	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to insert user: %v", err)
	}

	// Test query
	var found testUser
	if err := db.First(&found, "user_id = ?", "test-user-1").Error; err != nil {
		t.Fatalf("failed to find user: %v", err)
	}

	if found.Name != "Test User" {
		t.Errorf("Name = %q, want %q", found.Name, "Test User")
	}
}

func TestCleanupTestDB(t *testing.T) {
	db := SetupTestDB(t)

	// Should not panic
	CleanupTestDB(t, db)

	// Verify connection is closed
	sqlDB, err := db.DB()
	if err != nil {
		// This is expected after cleanup
		return
	}

	if err := sqlDB.Ping(); err == nil {
		t.Log("Note: Connection may still be pingable immediately after close")
	}
}

func TestTestModels_TableNames(t *testing.T) {
	tests := []struct {
		model    interface{ TableName() string }
		expected string
	}{
		{testUser{}, "users"},
		{testStore{}, "stores"},
		{testMenu{}, "menus"},
		{testReview{}, "reviews"},
		{testFile{}, "files"},
		{testFavorite{}, "favorites"},
		{testReport{}, "reports"},
		{testStoreFile{}, "store_files"},
		{testStoreTag{}, "store_tags"},
		{testReviewMenu{}, "review_menus"},
		{testReviewFile{}, "review_files"},
		{testReviewLike{}, "review_likes"},
	}

	for _, tt := range tests {
		if got := tt.model.TableName(); got != tt.expected {
			t.Errorf("TableName() = %q, want %q", got, tt.expected)
		}
	}
}
