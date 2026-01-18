package constants

import "testing"

func TestReportStatuses(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"ReportStatusPending", ReportStatusPending, "pending"},
		{"ReportStatusResolved", ReportStatusResolved, "resolved"},
		{"ReportStatusRejected", ReportStatusRejected, "rejected"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("%s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestSortOptions(t *testing.T) {
	if SortByNew != "new" {
		t.Errorf("SortByNew = %q, want %q", SortByNew, "new")
	}
	if SortByLiked != "liked" {
		t.Errorf("SortByLiked = %q, want %q", SortByLiked, "liked")
	}
}

func TestAuthProviders(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"ProviderEmail", ProviderEmail, "email"},
		{"ProviderGoogle", ProviderGoogle, "google"},
		{"ProviderApple", ProviderApple, "apple"},
		{"ProviderOAuth", ProviderOAuth, "oauth"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("%s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestTargetTypes(t *testing.T) {
	if TargetTypeReview != "review" {
		t.Errorf("TargetTypeReview = %q, want %q", TargetTypeReview, "review")
	}
	if TargetTypeStore != "store" {
		t.Errorf("TargetTypeStore = %q, want %q", TargetTypeStore, "store")
	}
}

func TestDefaultValues(t *testing.T) {
	if DefaultUserName != "user" {
		t.Errorf("DefaultUserName = %q, want %q", DefaultUserName, "user")
	}
}

func TestValidation(t *testing.T) {
	if MinPasswordLength != 6 {
		t.Errorf("MinPasswordLength = %d, want %d", MinPasswordLength, 6)
	}
}

func TestDatabaseSettings(t *testing.T) {
	if DBMaxOpenConns != 10 {
		t.Errorf("DBMaxOpenConns = %d, want %d", DBMaxOpenConns, 10)
	}
	if DBMaxIdleConns != 5 {
		t.Errorf("DBMaxIdleConns = %d, want %d", DBMaxIdleConns, 5)
	}
}
