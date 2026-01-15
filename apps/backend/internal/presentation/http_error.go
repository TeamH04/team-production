package presentation

import (
	"fmt"
	"net/http"
)

// HTTPError represents an HTTP-layer error decoupled from the Echo implementation.
type HTTPError struct {
	Status int
	Body   any
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("http error %d", e.Status)
}

func NewHTTPError(status int, body any) error {
	return &HTTPError{Status: status, Body: body}
}

func NewBadRequest(message string) error {
	return NewHTTPError(http.StatusBadRequest, NewErrorResponse(message))
}

func NewUnauthorized(message string) error {
	return NewHTTPError(http.StatusUnauthorized, NewErrorResponse(message))
}

func NewForbidden(message string) error {
	return NewHTTPError(http.StatusForbidden, NewErrorResponse(message))
}

func NewInternalServerError(message string) error {
	return NewHTTPError(http.StatusInternalServerError, NewErrorResponse(message))
}
