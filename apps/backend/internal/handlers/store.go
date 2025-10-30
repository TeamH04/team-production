package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/lib/pq"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// --- Store Handlers ---

// GET /api/stores
func GetStores(c echo.Context) error {
    db := c.Get("db").(*gorm.DB)
    var stores []domain.Store

    if err := db.Order("created_at desc").Find(&stores).Error; err != nil {
        c.Logger().Errorf("failed to fetch stores: %v", err)
        return c.JSON(http.StatusInternalServerError, echo.Map{"error": "internal server error"})
    }
    return c.JSON(http.StatusOK, stores)
}

// GET /api/stores/:id
func GetStoreByID(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}

	var store domain.Store
	if err := db.Preload("Menus").Preload("Reviews").First(&store, "store_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, store)
}

// POST /api/stores
type CreateStoreReq struct {
	Name            string   `json:"name"`
	Address         string   `json:"address"`
	ThumbnailURL    string   `json:"thumbnail_url"`
	OpenedAt        *time.Time `json:"opened_at,omitempty"`
	Description     *string  `json:"description,omitempty"`
	OpeningHours    *string  `json:"opening_hours,omitempty"`
	LandscapePhotos []string `json:"landscape_photos,omitempty"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
}

func CreateStore(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	var req CreateStoreReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	if req.Name == "" || req.Address == "" || req.ThumbnailURL == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing required fields"})
	}
	if req.Latitude == 0.0 || req.Longitude == 0.0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid latitude or longitude"})
	}

	store := domain.Store{
		Name:           req.Name,
		Address:        req.Address,
		ThumbnailURL:   req.ThumbnailURL,
		OpenedAt:       req.OpenedAt,
		Description:    req.Description,
		LandscapePhotos: pq.StringArray(req.LandscapePhotos),
		OpeningHours:   req.OpeningHours,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
	}

	if err := db.Create(&store).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, store)
}

// PUT /api/stores/:id
func UpdateStore(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)
	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var store domain.Store
	if err := db.First(&store, storeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	var updateData domain.Store
	if err := c.Bind(&updateData); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}

	updateData.UpdatedAt = time.Now()
	if err := db.Model(&store).Updates(updateData).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, store)
}

// DELETE /api/stores/:id
func DeleteStore(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)
	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var store domain.Store
	if err := db.First(&store, storeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	if err := db.Delete(&store).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to delete"})
	}
	return c.NoContent(http.StatusNoContent)
}
