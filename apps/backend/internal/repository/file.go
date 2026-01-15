package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type fileRepository struct {
	db *gorm.DB
}

// NewFileRepository は FileRepository の実装を生成します
func NewFileRepository(db *gorm.DB) output.FileRepository {
	return &fileRepository{db: db}
}

func (r *fileRepository) FindByStoreAndIDs(ctx context.Context, storeID string, fileIDs []string) ([]entity.File, error) {
	if len(fileIDs) == 0 {
		return nil, nil
	}

	var files []model.File
	if err := r.db.WithContext(ctx).
		Joins("JOIN store_files sf ON sf.file_id = files.file_id").
		Where("sf.store_id = ? AND files.file_id IN ?", storeID, fileIDs).
		Find(&files).Error; err != nil {
		return nil, mapDBError(err)
	}

	return model.ToEntities[entity.File, model.File](files), nil
}

func (r *fileRepository) Create(ctx context.Context, file *entity.File) error {
	record := model.File{
		FileID:      file.FileID,
		FileKind:    file.FileKind,
		FileName:    file.FileName,
		FileSize:    file.FileSize,
		ObjectKey:   file.ObjectKey,
		ContentType: file.ContentType,
		IsDeleted:   file.IsDeleted,
		CreatedBy:   file.CreatedBy,
	}
	if err := r.db.WithContext(ctx).Create(&record).Error; err != nil {
		return mapDBError(err)
	}
	file.FileID = record.FileID
	file.CreatedAt = record.CreatedAt
	return nil
}

func (r *fileRepository) LinkToStore(ctx context.Context, storeID string, fileID string) error {
	record := model.StoreFile{StoreID: storeID, FileID: fileID}
	return mapDBError(r.db.WithContext(ctx).Create(&record).Error)
}
