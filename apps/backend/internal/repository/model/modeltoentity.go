package model

import "github.com/TeamH04/team-production/apps/backend/internal/domain/entity"

type model[T any] interface {
	Entity() T
}

func ToEntities[Entity any, Model model[Entity]](models []Model) []Entity {
	ret := make([]Entity, len(models))
	for i, model := range models {
		ret[i] = model.Entity()
	}
	return ret
}

func (s Store) Entity() entity.Store {
	return entity.Store{
		StoreID:         s.StoreID,
		ThumbnailFileID: s.ThumbnailFileID,
		Name:            s.Name,
		OpenedAt:        s.OpenedAt,
		Description:     s.Description,
		Address:         s.Address,
		OpeningHours:    s.OpeningHours,
		Latitude:        s.Latitude,
		Longitude:       s.Longitude,
		GoogleMapURL:    s.GoogleMapURL,
		IsApproved:      s.IsApproved,
		CreatedAt:       s.CreatedAt,
		UpdatedAt:       s.UpdatedAt,
		Menus:           ToEntities[entity.Menu, Menu](s.Menus),
		Reviews:         ToEntities[entity.Review, Review](s.Reviews),
	}
}

func (m Menu) Entity() entity.Menu {
	return entity.Menu{
		MenuID:      m.MenuID,
		StoreID:     m.StoreID,
		Name:        m.Name,
		Price:       m.Price,
		Description: m.Description,
		CreatedAt:   m.CreatedAt,
	}
}

func (r Review) Entity() entity.Review {
	return entity.Review{
		ReviewID:  r.ReviewID,
		StoreID:   r.StoreID,
		UserID:    r.UserID,
		Rating:    r.Rating,
		Content:   r.Content,
		CreatedAt: r.CreatedAt,
		Menus:     ToEntities[entity.Menu, Menu](r.Menus),
		Files:     ToEntities[entity.File, File](r.Files),
	}
}

func (u User) Entity() entity.User {
	provider := u.Provider
	if provider == "" {
		provider = "email"
	}
	role := u.Role
	if role == "" {
		role = "user"
	}
	return entity.User{
		UserID:     u.UserID,
		Name:       u.Name,
		Email:      u.Email,
		IconURL:    u.IconURL,
		IconFileID: u.IconFileID,
		Provider:   provider,
		Gender:     u.Gender,
		Birthday:   u.Birthday,
		Role:       role,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
}

func (f Favorite) Entity() entity.Favorite {
	return entity.Favorite{
		UserID:    f.UserID,
		StoreID:   f.StoreID,
		CreatedAt: f.CreatedAt,
		Store: func() *entity.Store {
			if f.Store == nil {
				return nil
			}
			store := f.Store.Entity()
			return &store
		}(),
	}
}

func (f File) Entity() entity.File {
	return entity.File{
		FileID:      f.FileID,
		FileKind:    f.FileKind,
		FileName:    f.FileName,
		FileSize:    f.FileSize,
		ObjectKey:   f.ObjectKey,
		ContentType: f.ContentType,
		IsDeleted:   f.IsDeleted,
		CreatedAt:   f.CreatedAt,
		CreatedBy:   f.CreatedBy,
	}
}

func (r Report) Entity() entity.Report {
	return entity.Report{
		ReportID:   r.ReportID,
		UserID:     r.UserID,
		TargetType: r.TargetType,
		TargetID:   r.TargetID,
		Reason:     r.Reason,
		Status:     r.Status,
		CreatedAt:  r.CreatedAt,
		UpdatedAt:  r.UpdatedAt,
	}
}
