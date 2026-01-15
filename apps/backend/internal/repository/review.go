package repository

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type reviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository は ReviewRepository の実装を生成します
func NewReviewRepository(db *gorm.DB) output.ReviewRepository {
	return &reviewRepository{db: db}
}

type reviewRow struct {
	ReviewID   string    `gorm:"column:review_id"`
	StoreID    string    `gorm:"column:store_id"`
	UserID     string    `gorm:"column:user_id"`
	Rating     int       `gorm:"column:rating"`
	Content    *string   `gorm:"column:content"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	LikesCount int64     `gorm:"column:likes_count"`
	LikedByMe  bool      `gorm:"column:liked_by_me"`
}

func (r *reviewRepository) FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	var rows []reviewRow
	query := r.baseReviewQuery(ctx, viewerID).
		Where("r.store_id = ?", storeID).
		Group("r.review_id")

	if sort == "liked" {
		query = query.Order("likes_count desc").Order("r.created_at desc")
	} else {
		query = query.Order("r.created_at desc")
	}

	if err := query.Scan(&rows).Error; err != nil {
		return nil, mapDBError(err)
	}

	return r.attachReviewRelations(ctx, rows)
}

func (r *reviewRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Review, error) {
	var rows []reviewRow
	query := r.baseReviewQuery(ctx, "").
		Where("r.user_id = ?", userID).
		Group("r.review_id").
		Order("r.created_at desc")

	if err := query.Scan(&rows).Error; err != nil {
		return nil, mapDBError(err)
	}

	return r.attachReviewRelations(ctx, rows)
}

func (r *reviewRepository) FindByID(ctx context.Context, reviewID string) (*entity.Review, error) {
	var review model.Review
	if err := r.db.WithContext(ctx).First(&review, "review_id = ?", reviewID).Error; err != nil {
		return nil, mapDBError(err)
	}
	entityReview := review.Entity()
	return &entityReview, nil
}

func (r *reviewRepository) CreateInTx(ctx context.Context, tx interface{}, review output.CreateReview) error {
	txAsserted, ok := tx.(*gorm.DB)
	if !ok {
		return output.ErrInvalidTransaction
	}
	record := model.Review{
		StoreID: review.StoreID,
		UserID:  review.UserID,
		Rating:  review.Rating,
		Content: review.Content,
	}

	if err := txAsserted.WithContext(ctx).Create(&record).Error; err != nil {
		return mapDBError(err)
	}

	if len(review.MenuIDs) > 0 {
		rows := make([]model.ReviewMenu, 0, len(review.MenuIDs))
		for _, menuID := range review.MenuIDs {
			rows = append(rows, model.ReviewMenu{
				ReviewID: record.ReviewID,
				MenuID:   menuID,
			})
		}
		if err := txAsserted.WithContext(ctx).Create(&rows).Error; err != nil {
			return mapDBError(err)
		}
	}

	if len(review.FileIDs) > 0 {
		rows := make([]model.ReviewFile, 0, len(review.FileIDs))
		for _, fileID := range review.FileIDs {
			rows = append(rows, model.ReviewFile{
				ReviewID: record.ReviewID,
				FileID:   fileID,
			})
		}
		if err := txAsserted.WithContext(ctx).Create(&rows).Error; err != nil {
			return mapDBError(err)
		}
	}

	return nil
}

func (r *reviewRepository) AddLike(ctx context.Context, reviewID string, userID string) error {
	record := model.ReviewLike{ReviewID: reviewID, UserID: userID}
	return mapDBError(r.db.WithContext(ctx).
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&record).Error)
}

func (r *reviewRepository) RemoveLike(ctx context.Context, reviewID string, userID string) error {
	return mapDBError(r.db.WithContext(ctx).
		Where("review_id = ? AND user_id = ?", reviewID, userID).
		Delete(&model.ReviewLike{}).Error)
}

func (r *reviewRepository) baseReviewQuery(ctx context.Context, viewerID string) *gorm.DB {
	query := r.db.WithContext(ctx).
		Table("reviews r").
		Select("r.review_id, r.store_id, r.user_id, r.rating, r.content, r.created_at, COUNT(rl.review_id) AS likes_count").
		Joins("LEFT JOIN review_likes rl ON rl.review_id = r.review_id")

	if viewerID != "" {
		query = query.Select(
			"r.review_id, r.store_id, r.user_id, r.rating, r.content, r.created_at, COUNT(rl.review_id) AS likes_count, EXISTS(SELECT 1 FROM review_likes rl2 WHERE rl2.review_id = r.review_id AND rl2.user_id = ?) AS liked_by_me",
			viewerID,
		)
	} else {
		query = query.Select(
			"r.review_id, r.store_id, r.user_id, r.rating, r.content, r.created_at, COUNT(rl.review_id) AS likes_count, FALSE AS liked_by_me",
		)
	}

	return query
}

func (r *reviewRepository) attachReviewRelations(ctx context.Context, rows []reviewRow) ([]entity.Review, error) {
	if len(rows) == 0 {
		return nil, nil
	}

	reviewIDs := make([]string, len(rows))
	for i, row := range rows {
		reviewIDs[i] = row.ReviewID
	}

	filesByReview, err := fetchReviewFiles(ctx, r.db, reviewIDs)
	if err != nil {
		return nil, err
	}
	menusByReview, err := fetchReviewMenus(ctx, r.db, reviewIDs)
	if err != nil {
		return nil, err
	}

	result := make([]entity.Review, len(rows))
	for i, row := range rows {
		review := entity.Review{
			ReviewID:   row.ReviewID,
			StoreID:    row.StoreID,
			UserID:     row.UserID,
			Rating:     row.Rating,
			Content:    row.Content,
			CreatedAt:  row.CreatedAt,
			LikesCount: int(row.LikesCount),
			LikedByMe:  row.LikedByMe,
		}
		if files, ok := filesByReview[row.ReviewID]; ok {
			review.Files = files
		}
		if menus, ok := menusByReview[row.ReviewID]; ok {
			review.Menus = menus
		}
		result[i] = review
	}

	return result, nil
}

type reviewMenuRow struct {
	ReviewID string
	model.Menu
}

func fetchReviewMenus(ctx context.Context, db *gorm.DB, reviewIDs []string) (map[string][]entity.Menu, error) {
	if len(reviewIDs) == 0 {
		return nil, nil
	}

	var rows []reviewMenuRow
	if err := db.WithContext(ctx).
		Table("review_menus rm").
		Select(`rm.review_id, m.menu_id, m.store_id, m.name, m.price, m.description, m.created_at`).
		Joins("JOIN menus m ON m.menu_id = rm.menu_id").
		Where("rm.review_id IN ?", reviewIDs).
		Order("rm.review_id asc, m.menu_id asc").
		Scan(&rows).Error; err != nil {
		return nil, mapDBError(err)
	}

	result := make(map[string][]entity.Menu, len(rows))
	for _, row := range rows {
		result[row.ReviewID] = append(result[row.ReviewID], row.Menu.Entity())
	}

	return result, nil
}

type reviewFileRow struct {
	ReviewID string
	model.File
}

func fetchReviewFiles(ctx context.Context, db *gorm.DB, reviewIDs []string) (map[string][]entity.File, error) {
	if len(reviewIDs) == 0 {
		return nil, nil
	}

	var rows []reviewFileRow
	if err := db.WithContext(ctx).
		Table("review_files rf").
		Select(`rf.review_id, f.file_id, f.file_kind, f.file_name, f.file_size, f.object_key, f.content_type, f.is_deleted, f.created_at, f.created_by`).
		Joins("JOIN files f ON f.file_id = rf.file_id").
		Where("rf.review_id IN ?", reviewIDs).
		Order("rf.review_id asc, f.file_id asc").
		Scan(&rows).Error; err != nil {
		return nil, mapDBError(err)
	}

	result := make(map[string][]entity.File, len(rows))
	for _, row := range rows {
		result[row.ReviewID] = append(result[row.ReviewID], row.File.Entity())
	}

	return result, nil
}

func buildMenuRefs(menus []entity.Menu) []model.Menu {
	if len(menus) == 0 {
		return []model.Menu{}
	}
	records := make([]model.Menu, len(menus))
	for i, menu := range menus {
		records[i] = model.Menu{MenuID: menu.MenuID}
	}
	return records
}

func buildFileRefs(files []entity.File) []model.File {
	if len(files) == 0 {
		return []model.File{}
	}
	records := make([]model.File, len(files))
	for i, file := range files {
		records[i] = model.File{FileID: file.FileID}
	}
	return records
}
