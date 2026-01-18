package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// validRoles defines the allowed user roles.
var validRoles = map[string]bool{
	role.User:  true,
	role.Owner: true,
	role.Admin: true,
}

// IsValidRole checks if the given role is valid.
func IsValidRole(role string) bool {
	return validRoles[role]
}

// mustFindStore retrieves a store by ID and returns ErrStoreNotFound if not found.
func mustFindStore(ctx context.Context, repo output.StoreRepository, storeID string) (*entity.Store, error) {
	store, err := repo.FindByID(ctx, storeID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}
	return store, nil
}

// mustFindUser retrieves a user by ID and returns ErrUserNotFound if not found.
func mustFindUser(ctx context.Context, repo output.UserRepository, userID string) (entity.User, error) {
	user, err := repo.FindByID(ctx, userID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return entity.User{}, ErrUserNotFound
		}
		return entity.User{}, err
	}
	return user, nil
}

// ensureStoreExists checks if a store exists and returns ErrStoreNotFound if not.
func ensureStoreExists(ctx context.Context, repo output.StoreRepository, storeID string) error {
	_, err := mustFindStore(ctx, repo, storeID)
	return err
}

// ensureUserExists checks if a user exists and returns ErrUserNotFound if not.
func ensureUserExists(ctx context.Context, repo output.UserRepository, userID string) error {
	_, err := mustFindUser(ctx, repo, userID)
	return err
}

// mustFindReview retrieves a review by ID and returns ErrReviewNotFound if not found.
func mustFindReview(ctx context.Context, repo output.ReviewRepository, reviewID string) (*entity.Review, error) {
	review, err := repo.FindByID(ctx, reviewID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrReviewNotFound
		}
		return nil, err
	}
	return review, nil
}

// ensureReviewExists checks if a review exists and returns ErrReviewNotFound if not.
func ensureReviewExists(ctx context.Context, repo output.ReviewRepository, reviewID string) error {
	_, err := mustFindReview(ctx, repo, reviewID)
	return err
}

// mustFindReport retrieves a report by ID and returns ErrReportNotFound if not found.
func mustFindReport(ctx context.Context, repo output.ReportRepository, reportID int64) (*entity.Report, error) {
	report, err := repo.FindByID(ctx, reportID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrReportNotFound
		}
		return nil, err
	}
	return report, nil
}

// ensureReportExists checks if a report exists and returns ErrReportNotFound if not.
func ensureReportExists(ctx context.Context, repo output.ReportRepository, reportID int64) error {
	_, err := mustFindReport(ctx, repo, reportID)
	return err
}
