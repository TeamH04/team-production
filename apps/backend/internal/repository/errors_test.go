package repository

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

func TestMapDBError_NilError(t *testing.T) {
	result := mapDBError(nil)
	require.NoError(t, result)
}

func TestMapDBError_RecordNotFound(t *testing.T) {
	result := mapDBError(gorm.ErrRecordNotFound)

	require.Error(t, result)
	require.True(t, apperr.IsCode(result, apperr.CodeNotFound), "expected CodeNotFound, got %v", apperr.CodeOf(result))
	require.True(t, errors.Is(result, entity.ErrNotFound), "expected underlying error to be ErrNotFound")
}

func TestMapDBError_OtherGormErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
	}{
		{
			name: "ErrInvalidTransaction",
			err:  gorm.ErrInvalidTransaction,
		},
		{
			name: "ErrNotImplemented",
			err:  gorm.ErrNotImplemented,
		},
		{
			name: "ErrMissingWhereClause",
			err:  gorm.ErrMissingWhereClause,
		},
		{
			name: "ErrUnsupportedRelation",
			err:  gorm.ErrUnsupportedRelation,
		},
		{
			name: "ErrPrimaryKeyRequired",
			err:  gorm.ErrPrimaryKeyRequired,
		},
		{
			name: "ErrModelValueRequired",
			err:  gorm.ErrModelValueRequired,
		},
		{
			name: "ErrInvalidData",
			err:  gorm.ErrInvalidData,
		},
		{
			name: "ErrUnsupportedDriver",
			err:  gorm.ErrUnsupportedDriver,
		},
		{
			name: "ErrRegistered",
			err:  gorm.ErrRegistered,
		},
		{
			name: "ErrInvalidField",
			err:  gorm.ErrInvalidField,
		},
		{
			name: "ErrEmptySlice",
			err:  gorm.ErrEmptySlice,
		},
		{
			name: "ErrDryRunModeUnsupported",
			err:  gorm.ErrDryRunModeUnsupported,
		},
		{
			name: "ErrInvalidDB",
			err:  gorm.ErrInvalidDB,
		},
		{
			name: "ErrInvalidValue",
			err:  gorm.ErrInvalidValue,
		},
		{
			name: "ErrInvalidValueOfLength",
			err:  gorm.ErrInvalidValueOfLength,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := mapDBError(tt.err)

			// Other GORM errors should be returned as-is (not wrapped in apperr)
			require.Error(t, result)
			require.Equal(t, tt.err, result, "expected original error to be returned as-is")
			// Verify it's NOT wrapped as CodeNotFound
			require.False(t, apperr.IsCode(result, apperr.CodeNotFound), "should not be CodeNotFound")
		})
	}
}

func TestMapDBError_GenericError(t *testing.T) {
	genericErr := errors.New("some database connection error")
	result := mapDBError(genericErr)

	require.Error(t, result)
	require.Equal(t, genericErr, result, "expected original error to be returned as-is")
	require.False(t, apperr.IsCode(result, apperr.CodeNotFound), "should not be CodeNotFound")
}

func TestMapDBError_WrappedRecordNotFound(t *testing.T) {
	// Test that wrapped ErrRecordNotFound is still detected
	wrappedErr := errors.Join(errors.New("context"), gorm.ErrRecordNotFound)

	result := mapDBError(wrappedErr)

	require.Error(t, result)
	// errors.Is should detect wrapped ErrRecordNotFound
	require.True(t, apperr.IsCode(result, apperr.CodeNotFound), "wrapped ErrRecordNotFound should be CodeNotFound")
}

func TestMapDBError_CustomWrappedError(t *testing.T) {
	// Test a custom error that wraps ErrRecordNotFound
	customErr := customWrappedError{wrapped: gorm.ErrRecordNotFound}

	result := mapDBError(customErr)

	require.Error(t, result)
	require.True(t, apperr.IsCode(result, apperr.CodeNotFound), "custom wrapped ErrRecordNotFound should be CodeNotFound")
}

// customWrappedError is a helper type to test wrapped errors
type customWrappedError struct {
	wrapped error
}

func (e customWrappedError) Error() string {
	return "custom: " + e.wrapped.Error()
}

func (e customWrappedError) Unwrap() error {
	return e.wrapped
}
