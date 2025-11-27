package presentation

// MessageResponse wraps a success message payload.
type MessageResponse struct {
	Message string `json:"message"`
}

// NewMessageResponse builds a consistent response body for success messages.
func NewMessageResponse(msg string) MessageResponse {
	return MessageResponse{Message: msg}
}

// ErrorResponse wraps an error payload.
type ErrorResponse struct {
	Error string `json:"error"`
}

// NewErrorResponse builds a consistent error response body.
func NewErrorResponse(msg string) ErrorResponse {
	return ErrorResponse{Error: msg}
}
