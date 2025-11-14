package input_port

// SignupRequest は /api/auth/signup のリクエストボディです
type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}
