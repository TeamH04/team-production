package output

import "context"

// OwnerAuthAdmin updates Supabase user metadata for owner flows.
type OwnerAuthAdmin interface {
	UpdateUser(ctx context.Context, userID string, input AuthUserUpdate) error
}

// AuthUserUpdate describes metadata updates for Supabase admin API.
type AuthUserUpdate struct {
	Password     string
	AppMetadata  map[string]any
	UserMetadata map[string]any
}
