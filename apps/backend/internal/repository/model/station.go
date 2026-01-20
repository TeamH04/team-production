package model

import "github.com/TeamH04/team-production/apps/backend/internal/domain/entity"

type Station struct {
	ID   int64    `gorm:"primaryKey;autoIncrement"`
	Name string   `gorm:"not null"`
	Kana string   `gorm:"not null"`
	Kind string   `gorm:"not null"`
	Lat  *float64 `gorm:"type:double precision"`
	Lng  *float64 `gorm:"type:double precision"`
}

func (Station) TableName() string { return "stations" }

func (s *Station) Entity() entity.Station {
	return entity.Station{
		ID:   s.ID,
		Name: s.Name,
		Kana: s.Kana,
		Kind: s.Kind,
		Lat:  s.Lat,
		Lng:  s.Lng,
	}
}

func ToStationEntities(models []Station) []entity.Station {
	entities := make([]entity.Station, len(models))
	for i, m := range models {
		entities[i] = m.Entity()
	}
	return entities
}
