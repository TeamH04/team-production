package input_port

// AddFavoriteRequest は /api/users/:id/favorites のリクエストボディです
type AddFavoriteRequest struct {
	StoreID int64 `json:"store_id"`
}
