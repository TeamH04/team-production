package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// エラーメッセージの定数
const (
	errInvalidStoreID     = "invalid store ID"
	errStoreNotFound      = "store not found"
	errFailedToFindStore  = "failed to find store"
	errFailedToApprove    = "failed to approve store"
	errFailedToReject     = "failed to reject store"
	errFailedToGetStores  = "failed to retrieve pending stores"
)

// --- 管理者ハンドラー ---
type AdminStoreHandler struct {
	DB *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

//
// 🔒 JWT検証 + 管理者ロールチェック
//
func (h *AdminHandler) requireAdmin(c echo.Context) (*domain.User, error) {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid authorization header")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	secret := os.Getenv("SUPABASE_JWT_SECRET")
	if secret == "" {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "JWT secret not configured")
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid token claims")
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "missing user id in token")
	}

	// DBからユーザー取得
	var user domain.User
	if err := h.DB.First(&user, "user_id = ?", sub).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "user not found")
		}
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to verify user")
	}

	if user.UserRole != "admin" {
		return nil, echo.NewHTTPError(http.StatusForbidden, "admin privileges required")
	}

	return &user, nil
}

//
// --- GET /api/admin/stores/pending ---
//
func (h *AdminHandler) GetPendingStores(c echo.Context) error {
	if _, err := h.requireAdmin(c); err != nil {
		return err
	}

	var stores []domain.Store
	if err := h.DB.Where("is_approved = ?", false).Find(&stores).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, errFailedToGetStores)
	}
	return c.JSON(http.StatusOK, echo.Map{
		"status": "success",
		"stores": stores,
	})
}

//
// --- POST /api/admin/stores/:id/approve ---
//
func (h *AdminHandler) ApproveStore(c echo.Context) error {
	if _, err := h.requireAdmin(c); err != nil {
		return err
	}

	idStr := c.Param("id")
	storeID, err := strconv.Atoi(idStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, errInvalidStoreID)
	}

	var store domain.Store
	if err := h.DB.First(&store, storeID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return echo.NewHTTPError(http.StatusNotFound, errStoreNotFound)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, errFailedToFindStore)
	}

	store.IsApproved = true
	store.UpdatedAt = time.Now()
	if err := h.DB.Save(&store).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, errFailedToApprove)
	}

	return c.JSON(http.StatusOK, echo.Map{
		"status":  "success",
		"message": "store approved successfully",
		"store":   store,
	})
}

//
// --- POST /api/admin/stores/:id/reject ---
//
func (h *AdminHandler) RejectStore(c echo.Context) error {
	if _, err := h.requireAdmin(c); err != nil {
		return err
	}

	idStr := c.Param("id")
	storeID, err := strconv.Atoi(idStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, errInvalidStoreID)
	}

	var store domain.Store
	if err := h.DB.First(&store, storeID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return echo.NewHTTPError(http.StatusNotFound, errStoreNotFound)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, errFailedToFindStore)
	}

	store.IsApproved = false
	store.UpdatedAt = time.Now()
	if err := h.DB.Save(&store).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, errFailedToReject)
	}

	return c.JSON(http.StatusOK, echo.Map{
		"status":  "success",
		"message": "store rejected successfully",
		"store":   store,
	})
}
