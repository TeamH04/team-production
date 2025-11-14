package input_port

// UpdateRoleRequest は /api/auth/role のリクエストボディです
type UpdateRoleRequest struct {
	Role string `json:"role"`
}
