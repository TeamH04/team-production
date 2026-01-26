package entity

type Station struct {
	ID   int64    `json:"id"`
	Name string   `json:"name"`
	Kana string   `json:"kana"`
	Kind string   `json:"kind"`
	Lat  *float64 `json:"lat"`
	Lng  *float64 `json:"lng"`
}
