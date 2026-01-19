package constants

// Report statuses
const (
	ReportStatusPending  = "pending"
	ReportStatusResolved = "resolved"
	ReportStatusRejected = "rejected"
)

// Sort options for reviews
const (
	SortByNew   = "new"
	SortByLiked = "liked"
)

// Auth providers
const (
	ProviderEmail  = "email"
	ProviderGoogle = "google"
	ProviderApple  = "apple"
	ProviderOAuth  = "oauth"
)

// Target types for reports
const (
	TargetTypeReview = "review"
	TargetTypeStore  = "store"
)

// Default values
const (
	DefaultUserName = "user"
)

// Validation
const (
	MinPasswordLength = 6
)

// Database settings
const (
	DBMaxOpenConns = 10
	DBMaxIdleConns = 5
)
