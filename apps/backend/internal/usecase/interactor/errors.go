package interactor

import "errors"

var (
	// ErrStoreNotFound はストアが見つからない場合のエラー
	ErrStoreNotFound = errors.New("store not found")

	// ErrUserNotFound はユーザーが見つからない場合のエラー
	ErrUserNotFound = errors.New("user not found")

	// ErrInvalidInput は入力が不正な場合のエラー
	ErrInvalidInput = errors.New("invalid input")

	// ErrInvalidCoordinates は座標が不正な場合のエラー
	ErrInvalidCoordinates = errors.New("invalid coordinates")

	// ErrInvalidRating は評価が不正な場合のエラー
	ErrInvalidRating = errors.New("rating must be between 1 and 5")

	// ErrInvalidRole はロールが不正な場合のエラー
	ErrInvalidRole = errors.New("invalid role")

	// ErrAlreadyFavorite は既にお気に入り登録済みの場合のエラー
	ErrAlreadyFavorite = errors.New("already added to favorites")

	// ErrFavoriteNotFound はお気に入りが見つからない場合のエラー
	ErrFavoriteNotFound = errors.New("favorite not found")

	// ErrReportNotFound は通報が見つからない場合のエラー
	ErrReportNotFound = errors.New("report not found")

	// ErrInvalidTargetType は通報対象タイプが不正な場合のエラー
	ErrInvalidTargetType = errors.New("invalid target type")

	// ErrInvalidAction はアクションが不正な場合のエラー
	ErrInvalidAction = errors.New("invalid action")

	// ErrUnauthorized は認証エラー
	ErrUnauthorized = errors.New("unauthorized")

	// ErrForbidden は権限不足エラー
	ErrForbidden = errors.New("forbidden")
)
