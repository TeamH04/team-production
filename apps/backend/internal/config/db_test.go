package config

import (
	"strings"
	"testing"
)

func TestOpenDB_InvalidDSN(t *testing.T) {
	// Test with an invalid DSN
	_, err := OpenDB("invalid-dsn-format")
	if err == nil {
		t.Error("expected error for invalid DSN")
	}
}

func TestOpenDB_EmptyDSN(t *testing.T) {
	// Test with empty DSN
	_, err := OpenDB("")
	if err == nil {
		t.Error("expected error for empty DSN")
	}
}

func TestOpenDB_ConnectionRefused(t *testing.T) {
	// Test with a valid format DSN but unreachable host
	dsn := "postgres://user:pass@localhost:59999/nonexistent?sslmode=disable"
	_, err := OpenDB(dsn)
	if err == nil {
		t.Error("expected error for unreachable database")
	}
	// The error should mention connection issues
	errStr := err.Error()
	if !strings.Contains(errStr, "connect") && !strings.Contains(errStr, "dial") && !strings.Contains(errStr, "connection") && !strings.Contains(errStr, "refused") {
		t.Logf("Error message: %v", err)
	}
}

func TestOpenDB_MalformedDSN(t *testing.T) {
	// Test with malformed DSN
	dsn := "postgres://user:pass@:invalid-port/db"
	_, err := OpenDB(dsn)
	if err == nil {
		t.Error("expected error for malformed DSN")
	}
}
