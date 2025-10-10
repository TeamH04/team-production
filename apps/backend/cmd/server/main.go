// apps/backend/main.go
package main

import (
	"net/http"
	"os"
	"time"
	"strconv"
	"log"

	"github.com/labstack/echo/v4"
	//"github.com/labstack/echo/v4/middleware"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/TeamH04/team-production/apps/backend/internal/server"
	"github.com/TeamH04/team-production/apps/backend/internal/config" // もし config を使うなら
	"github.com/lib/pq"
)

// --- Models (DBのカラム名に合わせている点に注意) ---
type User struct {
	UserID    string     `gorm:"column:user_id;primaryKey;type:uuid" json:"user_id"`
	Name      string     `gorm:"column:name" json:"name"`
	Gender    *string    `gorm:"column:gender" json:"gender,omitempty"`
	Email     string     `gorm:"column:email" json:"email"`
	birthday  Date       `gorm:"column:birthday" json:"birthday,omitempty"`
	IconURL   string    `gorm:"column:icon_url" json:"icon_url"`
	Provider  string     `gorm:"column:provider" json:"provider"`
	User_Role string     `gorm:"column:user_role" json:"user_role"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

type Store struct {
	StoreID        int64           `gorm:"column:store_id;primaryKey;autoIncrement" json:"store_id"`
	ThumbnailURL   string          `gorm:"column:thumbnail_url" json:"thumbnail_url"`
	Name           string          `gorm:"column:name" json:"name"`
	OpenedAt       time.Time       `gorm:"column:opened_at" json:"opened_at,omitempty"`
	Description    *string         `gorm:"column:description" json:"description,omitempty"`
	LandscapePhotos pq.StringArray `gorm:"type:text[];column:landscape_photos" json:"landscape_photos,omitempty"`
	Address        string         `gorm:"column:address" json:"address"`
	OpeningHours   *string         `gorm:"column:opening_hours" json:"opening_hours,omitempty"`
	Latitude       float64        `gorm:"column:latitude" json:"latitude"`
	Longitude      float64        `gorm:"column:longitude" json:"longitude"`
	IsApproved     bool            `gorm:"column:is_approved",gorm:"default:false" json:"is_approved"`
	CreatedAt      time.Time       `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time       `gorm:"column:updated_at" json:"updated_at"`
	// 関連データ（メニュー・レビュー）を一緒に取得する場合に使用
	Menus          []Menu          `gorm:"foreignKey:StoreID;references:StoreID" json:"menus,omitempty"`
	Reviews        []Review        `gorm:"foreignKey:StoreID;references:StoreID" json:"reviews,omitempty"`
}

type Menu struct {
	MenuID    int64     `gorm:"column:menu_id;primaryKey;autoIncrement" json:"menu_id"`
	StoreID   int64     `gorm:"column:store_id" json:"store_id"`
	Name      string    `gorm:"column:name" json:"name"`
	Price     *int       `gorm:"column:price" json:"price,omitempty"`
	ImageURL  *string   `gorm:"column:image_url" json:"image_url,omitempty"`
	Description *string `gorm:"column:description" json:"description,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

type Review struct {
	ReviewID  int64          `gorm:"column:review_id;primaryKey;autoIncrement" json:"review_id"`
	StoreID   int64          `gorm:"column:store_id" json:"store_id"`
	UserID    string         `gorm:"column:user_id;type:uuid" json:"user_id"`
	MenuID    int64          `gorm:"column:menu_id" json:"menu_id,"`
	Rating    int            `gorm:"column:rating" json:"rating"`
	Content   *string        `gorm:"column:content" json:"content,omitempty"`
	ImageURLs pq.StringArray `gorm:"type:text[];column:image_urls" json:"image_urls,omitempty"`
	PostedAt  time.Time      `gorm:"column:posted_at" json:"posted_at"`
	CreatedAt time.Time      `gorm:"column:created_at" json:"created_at"`
}

// --- グローバル DB ハンドル ---
var db *gorm.DB

func initDB() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// デフォルト（ローカルDockerの例）
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/app?sslmode=disable"
	}
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	// ここでは auto-migrate は行わない（マイグレーションは既にSQLで管理しているため）
	return nil
}

// --- Handlers ---
// POST /api/auth/login
// SupabaseのJWTを検証し、既存ユーザーを返す
func loginUser(c echo.Context) error {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "missing authorization header"})
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Supabase JWTを検証
	parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("SUPABASE_JWT_SECRET")), nil
	})
	if err != nil || !parsedToken.Valid {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid token"})
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid claims"})
	}

	userID, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	name, _ := claims["name"].(string)
	picture, _ := claims["picture"].(string)

	if userID == "" || email == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing user info in token"})
	}

	// DBからユーザー検索
	var user User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		// Supabaseには存在するが、自前DBに登録されていない場合
		// （OAuth経由で新規ユーザーとして登録していないケース）
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "user not found in local database",
			"hint":  "please sign up first",
		})
	}

	// ユーザー情報を更新（最新のSupabase情報を反映）
	user.Name = name
	user.Email = email
	user.IconURL = picture
	user.UpdatedAt = time.Now()
	db.Save(&user)

	return c.JSON(http.StatusOK, echo.Map{
		"message": "login successful",
		"user":    user,
	})
}


// --- main ---
func main() {
	// DB 初期化
	if err := initDB(); err != nil {
		log.Fatalf("db open failed: %v", err)
	}

	// cfg は将来的に設定を読み込む想定。まずは空で安全に渡す。
	cfg := &config.Config{}

	// server.NewRouter で Echo インスタンスを作成（ミドルウェア類は router.go で登録される）
	e := server.NewRouter(cfg, db)

	// --- ここで API ハンドラを登録 ---
	api := e.Group("/api")
	api.GET("/stores", getStores)
	api.GET("/stores/:id", getStoreByID)
	api.POST("/stores", createStore)
	api.POST("/stores/:id/reviews", postReview)

	// ポート取得・起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
