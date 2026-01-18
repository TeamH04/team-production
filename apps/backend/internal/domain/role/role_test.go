package role

import "testing"

func TestRoleConstants(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"Admin", Admin, "admin"},
		{"Owner", Owner, "owner"},
		{"User", User, "user"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("%s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestOwnerOrAdmin(t *testing.T) {
	if len(OwnerOrAdmin) != 2 {
		t.Errorf("OwnerOrAdmin should have 2 elements, got %d", len(OwnerOrAdmin))
	}

	hasOwner := false
	hasAdmin := false
	for _, r := range OwnerOrAdmin {
		if r == Owner {
			hasOwner = true
		}
		if r == Admin {
			hasAdmin = true
		}
	}

	if !hasOwner {
		t.Error("OwnerOrAdmin should contain Owner")
	}
	if !hasAdmin {
		t.Error("OwnerOrAdmin should contain Admin")
	}
}
