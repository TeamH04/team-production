package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/lib/pq"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

type CreateReviewReq struct {
	UserID    string   `json:"user_id"`
	MenuID    int64    `json:"menu_id"`
	Rating    int      `json:"rating"`
	Content   *string  `json:"content,omitempty"`
	ImageURLs []string `json:"image_urls,omitempty"`
}

// POST /api/stores/:id/reviews
func CreateReview(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	storeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var req CreateReviewReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	if req.Rating < 1 || req.Rating > 5 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "rating must be between 1 and 5"})
	}

	review := domain.Review{
		StoreID:   storeID,
		UserID:    req.UserID,
		MenuID:    req.MenuID,
		Rating:    req.Rating,
		Content:   req.Content,
		ImageURLs: pq.StringArray(req.ImageURLs),
		PostedAt:  time.Now(),
		CreatedAt: time.Now(),
	}

	if err := db.Create(&review).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, review)
}

// GET /api/stores/:id/reviews?page=1&limit=10
func GetReviewsByStoreID(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	storeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	// --- ページネーション用パラメータ取得 ---
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	// --- 総レビュー数 ---
	var totalCount int64
	if err := db.Model(&domain.Review{}).Where("store_id = ?", storeID).Count(&totalCount).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to count reviews"})
	}

	// --- 平均評価（NULLの場合は0.0に） ---
	var avgRating float64
	if err := db.Model(&domain.Review{}).
		Select("COALESCE(AVG(rating), 0)").Where("store_id = ?", storeID).
		Scan(&avgRating).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to calculate average rating"})
	}

	// --- ページごとのレビュー取得 ---
	var reviews []domain.Review
	if err := db.
		Where("store_id = ?", storeID).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	// --- ページ情報構築 ---
	totalPages := (int(totalCount) + limit - 1) / limit
	response := echo.Map{
		"reviews":       reviews,
		"total_count":   totalCount,
		"average_rating": avgRating,
		"page":          page,
		"limit":         limit,
		"total_pages":   totalPages,
	}

	return c.JSON(http.StatusOK, response)
}
