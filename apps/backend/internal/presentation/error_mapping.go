package presentation

import (
	"net/http"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
)

// StatusFromError maps domain/usecase errors to HTTP status codes.
func StatusFromError(err error) int {
	switch apperr.CodeOf(err) {
	case apperr.CodeNotFound:
		return http.StatusNotFound
	case apperr.CodeInvalidInput:
		return http.StatusBadRequest
	case apperr.CodeConflict:
		return http.StatusConflict
	case apperr.CodeUnauthorized:
		return http.StatusUnauthorized
	case apperr.CodeForbidden:
		return http.StatusForbidden
	case apperr.CodeTooMany:
		return http.StatusTooManyRequests
	default:
		return http.StatusInternalServerError
	}
}
