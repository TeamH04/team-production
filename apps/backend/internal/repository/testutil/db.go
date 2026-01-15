package testutil

import (
	"os"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Test models without PostgreSQL-specific default values
type testUser struct {
	UserID     string     `gorm:"column:user_id;primaryKey"`
	Name       string     `gorm:"column:name"`
	Email      string     `gorm:"column:email"`
	IconURL    *string    `gorm:"column:icon_url"`
	IconFileID *string    `gorm:"column:icon_file_id"`
	Provider   string     `gorm:"column:provider"`
	Gender     *string    `gorm:"column:gender"`
	Birthday   *time.Time `gorm:"column:birthday"`
	Role       string     `gorm:"column:role;default:user"`
	CreatedAt  time.Time  `gorm:"column:created_at"`
	UpdatedAt  time.Time  `gorm:"column:updated_at"`
}

func (testUser) TableName() string { return "users" }

type testStore struct {
	StoreID         string     `gorm:"column:store_id;primaryKey"`
	ThumbnailFileID *string    `gorm:"column:thumbnail_file_id"`
	Name            string     `gorm:"column:name"`
	OpenedAt        *time.Time `gorm:"column:opened_at"`
	Description     *string    `gorm:"column:description"`
	Address         string     `gorm:"column:address"`
	OpeningHours    *string    `gorm:"column:opening_hours"`
	Latitude        float64    `gorm:"column:latitude"`
	Longitude       float64    `gorm:"column:longitude"`
	GoogleMapURL    *string    `gorm:"column:google_map_url"`
	PlaceID         string     `gorm:"column:place_id"`
	IsApproved      bool       `gorm:"column:is_approved;default:false"`
	Category        string     `gorm:"column:category;default:'カフェ・喫茶'"`
	Budget          string     `gorm:"column:budget;default:'$$'"`
	AverageRating   float64    `gorm:"column:average_rating;default:0.0"`
	DistanceMinutes int        `gorm:"column:distance_minutes;default:5"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at"`
}

func (testStore) TableName() string { return "stores" }

type testMenu struct {
	MenuID      string    `gorm:"column:menu_id;primaryKey"`
	StoreID     string    `gorm:"column:store_id"`
	Name        string    `gorm:"column:name"`
	Price       *int      `gorm:"column:price"`
	Description *string   `gorm:"column:description"`
	CreatedAt   time.Time `gorm:"column:created_at"`
}

func (testMenu) TableName() string { return "menus" }

type testReview struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey"`
	StoreID   string    `gorm:"column:store_id"`
	UserID    string    `gorm:"column:user_id"`
	Rating    int       `gorm:"column:rating"`
	Content   *string   `gorm:"column:content"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testReview) TableName() string { return "reviews" }

type testFile struct {
	FileID      string    `gorm:"column:file_id;primaryKey"`
	FileKind    string    `gorm:"column:file_kind"`
	FileName    string    `gorm:"column:file_name"`
	FileSize    *int64    `gorm:"column:file_size"`
	ObjectKey   string    `gorm:"column:object_key"`
	ContentType *string   `gorm:"column:content_type"`
	IsDeleted   bool      `gorm:"column:is_deleted"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	CreatedBy   *string   `gorm:"column:created_by"`
}

func (testFile) TableName() string { return "files" }

type testFavorite struct {
	UserID    string    `gorm:"column:user_id;primaryKey"`
	StoreID   string    `gorm:"column:store_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testFavorite) TableName() string { return "favorites" }

type testReport struct {
	ReportID   int64     `gorm:"column:report_id;primaryKey;autoIncrement"`
	UserID     string    `gorm:"column:user_id"`
	TargetType string    `gorm:"column:target_type"`
	TargetID   int64     `gorm:"column:target_id"`
	Reason     string    `gorm:"column:reason"`
	Status     string    `gorm:"column:status;default:pending"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"`
}

func (testReport) TableName() string { return "reports" }

type testStoreFile struct {
	StoreID   string    `gorm:"column:store_id;primaryKey"`
	FileID    string    `gorm:"column:file_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testStoreFile) TableName() string { return "store_files" }

type testStoreTag struct {
	StoreID   string    `gorm:"column:store_id;primaryKey"`
	Tag       string    `gorm:"column:tag;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testStoreTag) TableName() string { return "store_tags" }

type testReviewMenu struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey"`
	MenuID    string    `gorm:"column:menu_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testReviewMenu) TableName() string { return "review_menus" }

type testReviewFile struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey"`
	FileID    string    `gorm:"column:file_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testReviewFile) TableName() string { return "review_files" }

type testReviewLike struct {
	ReviewID  string    `gorm:"column:review_id;primaryKey"`
	UserID    string    `gorm:"column:user_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (testReviewLike) TableName() string { return "review_likes" }

// SetupTestDB creates a test database instance.
// By default, it uses SQLite in-memory database.
// Set TEST_DB_TYPE=postgres and TEST_DATABASE_URL to use PostgreSQL.
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dbType := os.Getenv("TEST_DB_TYPE")
	var db *gorm.DB
	var err error

	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	}

	if dbType == "postgres" {
		dsn := os.Getenv("TEST_DATABASE_URL")
		if dsn == "" {
			t.Skip("TEST_DATABASE_URL not set, skipping PostgreSQL test")
		}
		db, err = gorm.Open(postgres.Open(dsn), config)
	} else {
		// Default: SQLite in-memory
		db, err = gorm.Open(sqlite.Open(":memory:"), config)
	}

	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	// Run migrations with test models (without PostgreSQL-specific features)
	err = db.AutoMigrate(
		&testUser{},
		&testStore{},
		&testMenu{},
		&testReview{},
		&testFile{},
		&testFavorite{},
		&testReport{},
		&testStoreFile{},
		&testStoreTag{},
		&testReviewMenu{},
		&testReviewFile{},
		&testReviewLike{},
	)
	if err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	return db
}

// CleanupTestDB closes the database connection.
func CleanupTestDB(t *testing.T, db *gorm.DB) {
	t.Helper()
	sqlDB, err := db.DB()
	if err != nil {
		t.Logf("failed to get underlying sql.DB: %v", err)
		return
	}
	if err := sqlDB.Close(); err != nil {
		t.Logf("failed to close database: %v", err)
	}
}
