package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// --- POST /api/stores/:id/menus ---
type CreateMenuReq struct {
	Name        string  `json:"name"`
	Price       *int    `json:"price,omitempty"`
	ImageURL    *string `json:"image_url,omitempty"`
	Description *string `json:"description,omitempty"`
}

func CreateMenu(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	storeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var req CreateMenuReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "name is required"})
	}
	if req.Price <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "price must be greater than 0"})
	}

	menu := domain.Menu{
		StoreID:     storeID,
		Name:        req.Name,
		Price:       req.Price,
		ImageURL:    req.ImageURL,
		Description: req.Description,
		CreatedAt:   time.Now(),
	}

	if err := db.Create(&menu).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, menu)
}

// --- GET /api/stores/:id/menus ---
func GetMenusByStoreID(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	storeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var menus []domain.Menu
	if err := db.Where("store_id = ?", storeID).Order("created_at desc").Find(&menus).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, menus)
}
