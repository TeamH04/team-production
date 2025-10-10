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
// GET /api/stores
func getStores(c echo.Context) error {
	var stores []Store

	// 簡単なフィルタ例：tab=new は後で拡張する
	// データベースから Store テーブルのデータを新しい順に取得
	if err := db.Order("created_at desc").Find(&stores).Error; err != nil {
		// もしデータ取得でエラーが起きたら 500 エラーを返す
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// 取得したデータを JSON 形式にしてクライアントに返す
	return c.JSON(http.StatusOK, stores)
}


// POST /api/stores  (簡易：オーナー登録は後で認証追加)
type createStoreReq struct {
	Name         string   `json:"name"`
	Address      string   `json:"address"`
	ThumbnailURL string  `json:"thumbnail_url"`
	OpenedAt        *time.Time `json:"opened_at,omitempty"`
	Description     *string   `json:"description,omitempty"`
	OpeningHours    *string   `json:"opening_hours,omitempty"`
	LandscapePhotos []string  `json:"landscape_photos,omitempty"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
}
func createStore(c echo.Context) error {
	// ① JSONリクエストを createStoreReq 構造体に変換
	var req createStoreReq
	if err := c.Bind(&req); err != nil {
		// JSONの形式が間違っていたら400エラー
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON format"})
	}

	// 必須フィールドチェック
	if req.Name == "" || req.Address == "" || req.ThumbnailURL == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing required fields"})
	}

	if req.Latitude == 0 || req.Longitude == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid location coordinates"})
	}

	// ③ Store構造体を作成
	st := Store{
		Name: req.Name,
		Address: req.Address,
		ThumbnailURL: req.ThumbnailURL,
		OpenedAt: req.OpenedAt,
		Description: req.Description,
		LandscapePhotos: pq.StringArray(req.LandscapePhotos),
		OpeningHours: req.OpeningHours,
		Latitude: req.Latitude,
		Longitude: req.Longitude,
	}

	// ④ DBに保存
	if err := db.Create(&st).Error; err != nil {
		// DBエラーが起きたら500エラー
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to create store","detail": err.Error(),})
	}

	// ⑤ 成功 → 登録したお店情報を返す（201 Created）
	return c.JSON(http.StatusCreated, st)
}


// GET /api/stores/:id
func getStoreByID(c echo.Context) error {
	// ① URLの:id を取得 例: /api/stores/5 → idStr = "5"
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	
	// URLに指定されたお店のIDが正しいかどうかチェック
	if err != nil {
		// 数字に変換できなかったら「不正なID」として400エラー
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}

	var store Store
	// ② データベースから「そのidのお店」を探す
    //   同時に「メニュー」と「レビュー」も一緒に取得
	if err := db.Preload("Menus").Preload("Reviews").First(&store, "store_id = ?", id).Error; err != nil {

		// 見つからなかった場合 → 404エラーを返す
		if err == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "not found"})
		}
		// それ以外のDBエラー → 500エラー
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// ③ 見つかった場合 → お店の情報をJSONで返す
	return c.JSON(http.StatusOK, store)
}


// PUT /api/stores/:id
func updateStore(c echo.Context) error {
	// URLパラメータから店舗IDを取得
	id := c.Param("id")

	// 既存店舗を検索
	var store Store
	if err := db.First(&store, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// 更新データを受け取る構造体
	var updateData struct {
		Name           *string   `json:"name"`
		Description    *string   `json:"description"`
		ThumbnailURL   *string   `json:"thumbnail_url"`
		LandscapePhotos []string `json:"landscape_photos"`
		Address        *string   `json:"address"`
		OpeningHours   *string   `json:"opening_hours"`
		Latitude       *float64  `json:"latitude"`
		Longitude      *float64  `json:"longitude"`
		OpenedAt       *time.Time `json:"opened_at"`
	}

	// JSONをバインド
	if err := c.Bind(&updateData); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request body"})
	}

	// 値が存在する項目だけ更新
	if updateData.Name != nil {
		store.Name = *updateData.Name
	}
	if updateData.Description != nil {
		store.Description = *updateData.Description
	}
	if updateData.ThumbnailURL != nil {
		store.ThumbnailURL = *updateData.ThumbnailURL
	}
	if updateData.LandscapePhotos != nil {
		store.LandscapePhotos = pq.StringArray(*updateData.LandscapePhotos)
	}
	if updateData.Address != nil {
		store.Address = *updateData.Address
	}
	if updateData.OpeningHours != nil {
		store.OpeningHours = *updateData.OpeningHours
	}
	if updateData.Latitude != nil {
		store.Latitude = *updateData.Latitude
	}
	if updateData.Longitude != nil {
		store.Longitude = *updateData.Longitude
	}
	if updateData.OpenedAt != nil {
		store.OpenedAt = updateData.OpenedAt		
	}

	// 更新日時をセット
	store.UpdatedAt = time.Now()

	// 更新
	if err := db.Save(&store).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to update store", "detail": err.Error(),})
	}

	return c.JSON(http.StatusOK, store)
}


// DELETE /api/stores/:id
func deleteStore(c echo.Context) error {
	// ① URLパラメータから店舗IDを取得
	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	// ② （今後）管理者権限チェックを追加予定
	// 例: user := c.Get("user").(*User)
	// if !user.IsAdmin { return c.JSON(http.StatusForbidden, echo.Map{"error": "forbidden"}) }

	// ③ 店舗が存在するか確認
	var store Store
	if err := db.First(&store, storeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// ④ 店舗を削除
	if err := db.Delete(&store).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to delete store"})
	}

	// ⑤ 成功レスポンス（204 No Content）
	return c.NoContent(http.StatusNoContent)
}


// Menu モデル
type Menu struct {
	MenuID      int64   `json:"menu_id`
	StoreID     int64   `json:"store_id"`
	Name        string  `json:"name"`
	Price       *int    `json:"price"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
	CreatedAt   string  `json:"created_at"`
}

// GET /api/stores/:id/menus
func GetMenusByStore(c echo.Context) error {
	// URLパラメータから store_id を取得
	storeIDStr := c.Param("id")
	//文字列を整数に変換（DB検索用）
	storeID, err := strconv.ParseInt(storeIDStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	// DBオブジェクトを取得（ミドルウェアでセットされている）
	db := c.Get("db").(*gorm.DB)

	// 対象店舗のメニューを全て取得
	var menus []Menu
	if err := db.Where("store_id = ?", storeID).Order("created_at DESC").Find(&menus).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// 結果が空でも空配列を返す（404にはしない）
	return c.JSON(http.StatusOK, menus)
}


// POST /api/stores/:id/menus
type postMenuReq struct {
	Name        string  `json:"name"`
	Price       int     `json:"price"`
	Description *string  `json:"description,omitempty"`
	ImageURL   *string  `json:"image_urls,omitempty"`	
}

func postMenu(c echo.Context) error {
	// ① URL から店舗IDを取得
	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	// ② リクエストのJSONを構造体に変換
	var req postMenuReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request body"})
	}

	// ③ 必須項目チェック（nameとprice）
	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "menu name is required"})
	}
	if req.Price <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "price must be greater than 0"})
	}

	// ④ 店舗が存在するか確認（任意だが推奨）
	var exists bool
	if err := db.Model(&Store{}).
		Select("count(*) > 0").
		Where("store_id = ?", storeID).
		Find(&exists).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to check store existence"})
	}
	if !exists {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
	}

	// ④ Menu構造体を作成
	menu := Menu{
		StoreID:    storeID,
		Name:       req.Name,
		Price:      req.Price,
		Description: req.Description,
		ImageURL:  req.ImageURL,
	}

	// ⑤ データベースに保存
	if err := db.Create(&menu).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// ⑥ 成功レスポンス（201 Created）
	return c.JSON(http.StatusCreated, menu)
}


// GET /api/stores/:id/reviews
func getReviewsByStoreID(c echo.Context) error {
	// ① URLから店舗IDを取得
	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	// ② ページネーション設定（デフォルト: 1ページ10件）
	page, _ := strconv.Atoi(c.QueryParam("page"))
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if page < 1 {
		page = 1
	
	if limit < 1 || limit > 50 { // 1〜50件まで制限
		limit = 10
	}
	offset := (page - 1) * limit

	// ③ レビュー取得（ユーザー・メニュー情報を含む）
	var reviews []Review
	if err := db.Preload("User").Preload("Menu").
		Where("store_id = ?", storeID).
		Order("posted_at DESC").
		Limit(limit).Offset(offset).
		Find(&reviews).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// ④ レビューの平均評価を計算
	var avgRating float64
	if err := db.Model(&Review{}).
		Where("store_id = ?", storeID).
		Select("COALESCE(AVG(rating), 0)").Scan(&avgRating).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to calculate average"})
	}

	// ⑤ 総件数を取得してページ情報を返す
	var total int64
	db.Model(&Review{}).Where("store_id = ?", storeID).Count(&total)

	// ⑥ レスポンス
	resp := echo.Map{
		"store_id":        storeID,
		"page":            page,
		"limit":           limit,
		"total_reviews":   total,
		"average_rating":  avgRating,
		"reviews":         reviews,
	}

	return c.JSON(http.StatusOK, resp)
}


// POST /api/stores/:id/reviews
type postReviewReq struct {
	UserID    string   `json:"user_id"`
	MenuID    *int64   `json:"menu_id"`
	Rating    *int     `json:"rating"`
	Content   *string  `json:"content"`
	ImageURLs []string `json:"image_urls"`
}
func postReview(c echo.Context) error {
	// ① URLからお店IDを取得 (/api/stores/:id の :id 部分)
	idStr := c.Param("id")	// 例えば "/api/stores/10/reviews" なら "10"
	id, err := strconv.ParseInt(idStr, 10, 64)
	//URLに指定されたお店のIDが正しいかどうかチェック
	if err != nil { return c.JSON(http.StatusBadRequest, echo.Map{"error":"invalid id"}) }

	// ② リクエスト(JSON)を postReviewReq 構造体に変換
	var req postReviewReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error":"bad request"})
	}

	// ③ 必須チェック
	if req.MenuID == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "menu_id is required"})
	}
	if req.Rating == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "rating is required"})
	}
	if *req.Rating < 1 || *req.Rating > 5 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "rating must be between 1 and 5"})
	}

	r := Review{
		StoreID: id,			// お店のIDと紐づける
		UserID: req.UserID,		// 投稿者のユーザーID
		MenuID: req.MenuID,	    // どのメニューか
		Rating: req.Rating,	    // 評価（任意）
		Content: req.Content,	// 感想（任意）
		ImageURLs: pq.StringArray(req.ImageURLs),	// 複数画像のURL
		PostedAt: time.Now(),
		CreatedAt: time.Now(),
	}

	// ④ DBに保存
	if err := db.Create(&r).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// ⑤ 成功 → 登録したレビュー情報を返す（201 Created）
	return c.JSON(http.StatusCreated, r)
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
