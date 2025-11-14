package input_port

// HandleReportRequest は通報対応リクエストの入力構造体です
type HandleReportRequest struct {
	Action string `json:"action"` // "resolve" or "reject"
}
