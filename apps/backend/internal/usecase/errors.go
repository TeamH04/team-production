package usecase

import (
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
)

var (
	// ErrStoreNotFound はストアが見つからない場合のエラー
	ErrStoreNotFound = apperr.New(apperr.CodeNotFound, errors.New("store not found"))

	// ErrUserNotFound はユーザーが見つからない場合のエラー
	ErrUserNotFound = apperr.New(apperr.CodeNotFound, errors.New("user not found"))

	// ErrInvalidInput は入力が不正な場合のエラー
	ErrInvalidInput = apperr.New(apperr.CodeInvalidInput, errors.New("invalid input"))

	// ErrInvalidCoordinates は座標が不正な場合のエラー
	ErrInvalidCoordinates = apperr.New(apperr.CodeInvalidInput, errors.New("invalid coordinates"))

	// ErrInvalidRating は評価が不正な場合のエラー
	ErrInvalidRating = apperr.New(apperr.CodeInvalidInput, errors.New("rating must be between 1 and 5"))

	// ErrInvalidRole はロールが不正な場合のエラー
	ErrInvalidRole = apperr.New(apperr.CodeInvalidInput, errors.New("invalid role"))

	// ErrAlreadyFavorite は既にお気に入り登録済みの場合のエラー
	ErrAlreadyFavorite = apperr.New(apperr.CodeConflict, errors.New("already added to favorites"))

	// ErrFavoriteNotFound はお気に入りが見つからない場合のエラー
	ErrFavoriteNotFound = apperr.New(apperr.CodeNotFound, errors.New("favorite not found"))

	// ErrReviewNotFound はレビューが見つからない場合のエラー
	ErrReviewNotFound = apperr.New(apperr.CodeNotFound, errors.New("review not found"))

	// ErrReportNotFound は通報が見つからない場合のエラー
	ErrReportNotFound = apperr.New(apperr.CodeNotFound, errors.New("report not found"))

	// ErrInvalidTargetType は通報対象タイプが不正な場合のエラー
	ErrInvalidTargetType = apperr.New(apperr.CodeInvalidInput, errors.New("invalid target type"))

	// ErrInvalidAction はアクションが不正な場合のエラー
	ErrInvalidAction = apperr.New(apperr.CodeInvalidInput, errors.New("invalid action"))

	// ErrUnauthorized は認証エラー
	ErrUnauthorized = apperr.New(apperr.CodeUnauthorized, errors.New("unauthorized"))

	// ErrForbidden は権限不足エラー
	ErrForbidden = apperr.New(apperr.CodeForbidden, errors.New("forbidden"))

	// ErrUserAlreadyExists はメールアドレス重複時のエラー
	ErrUserAlreadyExists = apperr.New(apperr.CodeConflict, errors.New("user already exists"))

	// ErrInvalidContentType は許可されていないContent-Typeの場合のエラー
	ErrInvalidContentType = apperr.New(apperr.CodeInvalidInput, errors.New("invalid content type: only image files are allowed"))

	// ErrInvalidFileIDs は無効なファイルIDが指定された場合のエラー
	ErrInvalidFileIDs = apperr.New(apperr.CodeInvalidInput, errors.New("invalid file IDs"))
)
