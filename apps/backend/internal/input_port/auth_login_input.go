package input_port

// LoginRequest は /api/auth/login のリクエストボディです
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
