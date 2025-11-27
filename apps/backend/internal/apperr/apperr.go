package apperr

import (
	"errors"
	"fmt"
)

// Code represents a high-level application error category.
type Code string

const (
	CodeUnknown      Code = "unknown"
	CodeInvalidInput Code = "invalid_input"
	CodeNotFound     Code = "not_found"
	CodeConflict     Code = "conflict"
	CodeUnauthorized Code = "unauthorized"
	CodeForbidden    Code = "forbidden"
	CodeInternal     Code = "internal"
)

// Error represents an application error with a specific Code.
type Error interface {
	error
	Code() Code
}

type appError struct {
	code Code
	err  error
}

// New creates a new application error for the provided code.
func New(code Code, err error) error {
	if err == nil {
		err = errors.New(string(code))
	}
	return &appError{code: code, err: err}
}

// Errorf formats a message and wraps it in a coded error.
func Errorf(code Code, format string, args ...interface{}) error {
	return New(code, fmt.Errorf(format, args...))
}

func (e *appError) Error() string {
	return e.err.Error()
}

func (e *appError) Unwrap() error {
	return e.err
}

func (e *appError) Code() Code {
	return e.code
}

// CodeOf inspects err and returns the associated Code, or CodeUnknown.
func CodeOf(err error) Code {
	var appErr Error
	if errors.As(err, &appErr) {
		return appErr.Code()
	}
	return CodeUnknown
}

// IsCode reports whether err carries the provided Code.
func IsCode(err error, code Code) bool {
	return CodeOf(err) == code
}
