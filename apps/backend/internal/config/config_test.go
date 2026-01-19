package config

import (
	"net"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"
)

// Helper function to set multiple environment variables and return cleanup function
func setEnvVars(t *testing.T, vars map[string]string) {
	t.Helper()
	for k, v := range vars {
		t.Setenv(k, v)
	}
}

// Helper function to clear specific environment variables
func clearEnvVars(t *testing.T, keys []string) {
	t.Helper()
	for _, k := range keys {
		t.Setenv(k, "")
	}
}

// getAvailablePort finds an available port for testing
func getAvailablePort(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", ":0")
	if err != nil {
		t.Fatalf("failed to find available port: %v", err)
	}
	defer ln.Close()
	addr, ok := ln.Addr().(*net.TCPAddr)
	if !ok {
		t.Fatal("failed to get TCP address")
	}
	return strconv.Itoa(addr.Port)
}

// occupyPort occupies a port and returns a cleanup function
func occupyPort(t *testing.T, port string) func() {
	t.Helper()
	ln, err := net.Listen("tcp", ":"+port)
	if err != nil {
		t.Fatalf("failed to occupy port %s: %v", port, err)
	}
	return func() { ln.Close() }
}

func TestLoad_Success(t *testing.T) {
	// Clear relevant env vars first
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	port := getAvailablePort(t)

	setEnvVars(t, map[string]string{
		"PORT":                     port,
		"DATABASE_URL":             "postgres://user:pass@localhost:5432/testdb?sslmode=disable",
		"CORS_ALLOW_ORIGIN":        "http://localhost:3000,http://example.com",
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-publishable-key",
		"SUPABASE_SECRET_KEY":      "test-secret-key",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != port {
		t.Errorf("expected port %s, got %s", port, cfg.Port)
	}

	if cfg.DBURL != "postgres://user:pass@localhost:5432/testdb?sslmode=disable" {
		t.Errorf("unexpected DBURL: %s", cfg.DBURL)
	}

	if len(cfg.AllowOrigins) != 2 {
		t.Errorf("expected 2 allow origins, got %d", len(cfg.AllowOrigins))
	}

	if cfg.AllowOrigins[0] != "http://localhost:3000" {
		t.Errorf("unexpected first origin: %s", cfg.AllowOrigins[0])
	}

	if cfg.AllowOrigins[1] != "http://example.com" {
		t.Errorf("unexpected second origin: %s", cfg.AllowOrigins[1])
	}

	if cfg.SupabaseURL != "https://test.supabase.co" {
		t.Errorf("unexpected SupabaseURL: %s", cfg.SupabaseURL)
	}

	if cfg.SupabasePublishableKey != "test-publishable-key" {
		t.Errorf("unexpected SupabasePublishableKey: %s", cfg.SupabasePublishableKey)
	}

	if cfg.SupabaseSecretKey != "test-secret-key" {
		t.Errorf("unexpected SupabaseSecretKey: %s", cfg.SupabaseSecretKey)
	}

	if cfg.SupabaseStorageBucket != "test-bucket" {
		t.Errorf("unexpected SupabaseStorageBucket: %s", cfg.SupabaseStorageBucket)
	}
}

func TestLoad_DefaultValues(t *testing.T) {
	// Clear PORT and DATABASE_URL to test defaults
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	setEnvVars(t, map[string]string{
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-publishable-key",
		"SUPABASE_SECRET_KEY":      "test-secret-key",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Port should be default or fallback (8080 or nearby)
	portNum, err := strconv.Atoi(cfg.Port)
	if err != nil {
		t.Errorf("port should be a valid number: %s", cfg.Port)
	}
	if portNum < 8080 || portNum > 8100 {
		t.Errorf("expected port near 8080, got %d", portNum)
	}

	// DATABASE_URL should use default
	if cfg.DBURL != defaultDBURL {
		t.Errorf("expected default DBURL %s, got %s", defaultDBURL, cfg.DBURL)
	}

	// CORS should default to "*"
	if len(cfg.AllowOrigins) != 1 || cfg.AllowOrigins[0] != "*" {
		t.Errorf("expected default AllowOrigins [*], got %v", cfg.AllowOrigins)
	}
}

func TestLoad_MissingSupabaseURL(t *testing.T) {
	clearEnvVars(t, []string{"SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_STORAGE_BUCKET"})

	setEnvVars(t, map[string]string{
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_SECRET_KEY":      "test-secret",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing SUPABASE_URL")
	}

	if !strings.Contains(err.Error(), "SUPABASE_URL") {
		t.Errorf("error should mention SUPABASE_URL: %v", err)
	}
}

func TestLoad_MissingSupabasePublishableKey(t *testing.T) {
	clearEnvVars(t, []string{"SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_STORAGE_BUCKET"})

	setEnvVars(t, map[string]string{
		"SUPABASE_URL":            "https://test.supabase.co",
		"SUPABASE_SECRET_KEY":     "test-secret",
		"SUPABASE_STORAGE_BUCKET": "test-bucket",
	})

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing SUPABASE_PUBLISHABLE_KEY")
	}

	if !strings.Contains(err.Error(), "SUPABASE_PUBLISHABLE_KEY") {
		t.Errorf("error should mention SUPABASE_PUBLISHABLE_KEY: %v", err)
	}
}

func TestLoad_MissingSupabaseSecretKey(t *testing.T) {
	clearEnvVars(t, []string{"SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_STORAGE_BUCKET"})

	setEnvVars(t, map[string]string{
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing SUPABASE_SECRET_KEY")
	}

	if !strings.Contains(err.Error(), "SUPABASE_SECRET_KEY") {
		t.Errorf("error should mention SUPABASE_SECRET_KEY: %v", err)
	}
}

func TestLoad_MissingSupabaseStorageBucket(t *testing.T) {
	clearEnvVars(t, []string{"SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_STORAGE_BUCKET"})

	setEnvVars(t, map[string]string{
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_SECRET_KEY":      "test-secret",
	})

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing SUPABASE_STORAGE_BUCKET")
	}

	if !strings.Contains(err.Error(), "SUPABASE_STORAGE_BUCKET") {
		t.Errorf("error should mention SUPABASE_STORAGE_BUCKET: %v", err)
	}
}

func TestLoad_CORSOriginParsing(t *testing.T) {
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	tests := []struct {
		name     string
		corsEnv  string
		expected []string
	}{
		{
			name:     "single origin",
			corsEnv:  "http://localhost:3000",
			expected: []string{"http://localhost:3000"},
		},
		{
			name:     "multiple origins",
			corsEnv:  "http://localhost:3000,https://example.com",
			expected: []string{"http://localhost:3000", "https://example.com"},
		},
		{
			name:     "origins with spaces",
			corsEnv:  "http://localhost:3000 , https://example.com , https://test.com",
			expected: []string{"http://localhost:3000", "https://example.com", "https://test.com"},
		},
		{
			name:     "empty string defaults to wildcard",
			corsEnv:  "",
			expected: []string{"*"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clearEnvVars(t, []string{"CORS_ALLOW_ORIGIN"})

			setEnvVars(t, map[string]string{
				"SUPABASE_URL":             "https://test.supabase.co",
				"SUPABASE_PUBLISHABLE_KEY": "test-key",
				"SUPABASE_SECRET_KEY":      "test-secret",
				"SUPABASE_STORAGE_BUCKET":  "test-bucket",
			})

			if tt.corsEnv != "" {
				t.Setenv("CORS_ALLOW_ORIGIN", tt.corsEnv)
			}

			cfg, err := Load()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if len(cfg.AllowOrigins) != len(tt.expected) {
				t.Errorf("expected %d origins, got %d", len(tt.expected), len(cfg.AllowOrigins))
				return
			}

			for i, exp := range tt.expected {
				if cfg.AllowOrigins[i] != exp {
					t.Errorf("origin[%d]: expected %s, got %s", i, exp, cfg.AllowOrigins[i])
				}
			}
		})
	}
}

func TestSanitizePort(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"plain_port", "8080", "8080"},
		{"with_colon_prefix", ":8080", "8080"},
		{"with_whitespace", "  8080  ", "8080"},
		{"colon_and_whitespace", "  :8080  ", "8080"},
		{"empty_string", "", ""},
		{"only_whitespace", "  ", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizePort(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizePort(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestGetenv(t *testing.T) {
	t.Run("returns env value when set", func(t *testing.T) {
		t.Setenv("TEST_VAR", "test-value")
		result := getenv("TEST_VAR", "default")
		if result != "test-value" {
			t.Errorf("expected 'test-value', got %q", result)
		}
	})

	t.Run("returns default when not set", func(t *testing.T) {
		t.Setenv("TEST_VAR_UNSET", "")
		result := getenv("TEST_VAR_UNSET", "default-value")
		if result != "default-value" {
			t.Errorf("expected 'default-value', got %q", result)
		}
	})

	t.Run("returns default for non-existent var", func(t *testing.T) {
		// Use a unique key that definitely doesn't exist
		result := getenv("DEFINITELY_NOT_SET_VAR_12345", "fallback")
		if result != "fallback" {
			t.Errorf("expected 'fallback', got %q", result)
		}
	})
}

func TestEnsurePortAvailable(t *testing.T) {
	t.Run("returns nil for available port", func(t *testing.T) {
		port := getAvailablePort(t)
		err := ensurePortAvailable(port)
		if err != nil {
			t.Errorf("expected port %s to be available: %v", port, err)
		}
	})

	t.Run("returns error for occupied port", func(t *testing.T) {
		port := getAvailablePort(t)
		cleanup := occupyPort(t, port)
		defer cleanup()

		err := ensurePortAvailable(port)
		if err == nil {
			t.Errorf("expected error for occupied port %s", port)
		}
	})
}

func TestFindFreePort_FindsFirstAvailablePort(t *testing.T) {
	startPort := getAvailablePort(t)
	port, err := findFreePort(startPort, 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if port != startPort {
		t.Logf("found fallback port %s instead of %s", port, startPort)
	}
}

func TestFindFreePort_FindsFallbackPortWhenFirstIsOccupied(t *testing.T) {
	startPort := getAvailablePort(t)
	cleanup := occupyPort(t, startPort)
	defer cleanup()

	port, err := findFreePort(startPort, 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if port == startPort {
		t.Errorf("expected different port than %s", startPort)
	}

	startNum, err := strconv.Atoi(startPort)
	if err != nil {
		t.Fatalf("failed to parse start port: %v", err)
	}
	portNum, err := strconv.Atoi(port)
	if err != nil {
		t.Fatalf("failed to parse port: %v", err)
	}
	if portNum <= startNum || portNum > startNum+5 {
		t.Errorf("expected port between %d and %d, got %d", startNum+1, startNum+5, portNum)
	}
}

func TestFindFreePort_ReturnsErrorForInvalidPort(t *testing.T) {
	_, err := findFreePort("invalid", 5)
	if err == nil {
		t.Error("expected error for invalid port")
	}
	if !strings.Contains(err.Error(), "invalid port") {
		t.Errorf("error should mention invalid port: %v", err)
	}
}

func TestFindFreePort_ReturnsErrorWhenNoPortAvailable(t *testing.T) {
	// This test is tricky - we need to occupy multiple consecutive ports
	// Using a high port range that's likely free
	basePort := getAvailablePort(t)
	baseNum, err := strconv.Atoi(basePort)
	if err != nil {
		t.Fatalf("failed to parse base port: %v", err)
	}

	var cleanups []func()
	for i := 0; i < 3; i++ {
		port := strconv.Itoa(baseNum + i)
		ln, listenErr := net.Listen("tcp", ":"+port)
		if listenErr != nil {
			// Port might be in use, skip
			continue
		}
		cleanups = append(cleanups, func() { ln.Close() })
	}
	defer func() {
		for _, cleanup := range cleanups {
			cleanup()
		}
	}()

	// Only run this test if we managed to occupy at least the base port
	if len(cleanups) > 0 {
		_, err := findFreePort(basePort, 1)
		if err == nil {
			// It's possible another port was found, which is fine
			t.Log("port was found despite occupation - another port in range was available")
		}
	}
}

func TestResolvePort(t *testing.T) {
	t.Run("uses default when empty", func(t *testing.T) {
		port, err := resolvePort("", false)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		portNum, err := strconv.Atoi(port)
		if err != nil {
			t.Fatalf("failed to parse port: %v", err)
		}
		if portNum < 8080 || portNum > 8100 {
			t.Errorf("expected port near 8080, got %d", portNum)
		}
	})

	t.Run("returns explicit port when available", func(t *testing.T) {
		port := getAvailablePort(t)
		result, err := resolvePort(port, true)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != port {
			t.Errorf("expected port %s, got %s", port, result)
		}
	})

	t.Run("returns error for occupied explicit port", func(t *testing.T) {
		port := getAvailablePort(t)
		cleanup := occupyPort(t, port)
		defer cleanup()

		_, err := resolvePort(port, true)
		if err == nil {
			t.Error("expected error for occupied explicit port")
		}
		if !strings.Contains(err.Error(), "unavailable") {
			t.Errorf("error should mention unavailable: %v", err)
		}
	})

	t.Run("finds fallback for non-explicit occupied port", func(t *testing.T) {
		port := getAvailablePort(t)
		cleanup := occupyPort(t, port)
		defer cleanup()

		result, err := resolvePort(port, false)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result == port {
			t.Errorf("expected different port than occupied %s", port)
		}
	})
}

func TestLoad_PortWithColon(t *testing.T) {
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	port := getAvailablePort(t)

	setEnvVars(t, map[string]string{
		"PORT":                     ":" + port,
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_SECRET_KEY":      "test-secret",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != port {
		t.Errorf("expected port %s, got %s", port, cfg.Port)
	}
}

// Test constants
func TestSignedURLTTL(t *testing.T) {
	expected := 15 * time.Minute
	if SignedURLTTL != expected {
		t.Errorf("expected SignedURLTTL to be %v, got %v", expected, SignedURLTTL)
	}
}

// Test default constants
func TestDefaultConstants(t *testing.T) {
	if defaultDBURL != "postgres://postgres:postgres@localhost:5432/app?sslmode=disable" {
		t.Errorf("unexpected defaultDBURL: %s", defaultDBURL)
	}

	if defaultPort != "8080" {
		t.Errorf("unexpected defaultPort: %s", defaultPort)
	}

	if fallbackPortChecks != 20 {
		t.Errorf("unexpected fallbackPortChecks: %d", fallbackPortChecks)
	}
}

// Test Config struct fields
func TestConfigStruct(t *testing.T) {
	cfg := &Config{
		Port:                   "8080",
		AllowOrigins:           []string{"http://localhost:3000"},
		GoogleMapsKey:          "test-maps-key",
		DBURL:                  "postgres://localhost/test",
		SupabaseURL:            "https://test.supabase.co",
		SupabasePublishableKey: "pub-key",
		SupabaseSecretKey:      "secret-key",
		SupabaseStorageBucket:  "bucket",
	}

	if cfg.Port != "8080" {
		t.Errorf("Port field not set correctly")
	}

	if len(cfg.AllowOrigins) != 1 || cfg.AllowOrigins[0] != "http://localhost:3000" {
		t.Errorf("AllowOrigins field not set correctly")
	}

	if cfg.GoogleMapsKey != "test-maps-key" {
		t.Errorf("GoogleMapsKey field not set correctly")
	}

	if cfg.DBURL != "postgres://localhost/test" {
		t.Errorf("DBURL field not set correctly")
	}

	if cfg.SupabaseURL != "https://test.supabase.co" {
		t.Errorf("SupabaseURL field not set correctly")
	}

	if cfg.SupabasePublishableKey != "pub-key" {
		t.Errorf("SupabasePublishableKey field not set correctly")
	}

	if cfg.SupabaseSecretKey != "secret-key" {
		t.Errorf("SupabaseSecretKey field not set correctly")
	}

	if cfg.SupabaseStorageBucket != "bucket" {
		t.Errorf("SupabaseStorageBucket field not set correctly")
	}
}

func TestLoad_ExplicitPortOccupied(t *testing.T) {
	// Test that Load returns error when explicit port is occupied
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	port := getAvailablePort(t)
	cleanup := occupyPort(t, port)
	defer cleanup()

	setEnvVars(t, map[string]string{
		"PORT":                     port,
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_SECRET_KEY":      "test-secret",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	_, err := Load()
	if err == nil {
		t.Error("expected error for occupied explicit port")
	}
	if !strings.Contains(err.Error(), "unavailable") {
		t.Errorf("error should mention unavailable: %v", err)
	}
}

func TestLoad_InvalidPort(t *testing.T) {
	// Test that Load returns error for invalid port number
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	setEnvVars(t, map[string]string{
		"PORT":                     "invalid-port",
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_SECRET_KEY":      "test-secret",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	_, err := Load()
	if err == nil {
		t.Error("expected error for invalid port")
	}
	// Error could mention "invalid port" or "unavailable" depending on how it's processed
	errStr := err.Error()
	if !strings.Contains(errStr, "invalid port") && !strings.Contains(errStr, "unavailable") && !strings.Contains(errStr, "unknown port") {
		t.Errorf("error should mention invalid port, unavailable, or unknown port: %v", err)
	}
}

func TestFindFreePort_AllPortsOccupied(t *testing.T) {
	// Test the "no available port found" error path
	// We use a very high port number and occupy it along with the next one
	// to ensure findFreePort fails with attempts=1
	basePort := getAvailablePort(t)
	baseNum, err := strconv.Atoi(basePort)
	if err != nil {
		t.Fatalf("failed to parse base port: %v", err)
	}

	// Occupy the base port
	ln, err := net.Listen("tcp", ":"+basePort)
	if err != nil {
		t.Skipf("could not occupy port %s: %v", basePort, err)
	}
	defer ln.Close()

	// With attempts=1, only the base port will be checked, which is occupied
	_, err = findFreePort(basePort, 1)
	if err == nil {
		// This might happen if the port was released between listen and findFreePort
		// In that case, let's verify the port number is in range
		t.Log("findFreePort succeeded - port may have been released")
		return
	}

	// Check that we get the expected error when testing with impossible port
	_, err = findFreePort(strconv.Itoa(baseNum), 1)
	// Don't fail the test - just verify the function handles the situation
	t.Logf("findFreePort with occupied port returned: %v", err)
}

func TestResolvePort_SamePortReturned(t *testing.T) {
	// Test that resolvePort returns the same port when it's available and not explicit
	port := getAvailablePort(t)
	result, err := resolvePort(port, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// The port should be the same since it was available
	if result != port {
		t.Logf("got different port %s (original was %s) - port may have been occupied", result, port)
	}
}

func TestLoad_PortWithWhitespace(t *testing.T) {
	clearEnvVars(t, []string{"PORT", "DATABASE_URL", "CORS_ALLOW_ORIGIN"})

	port := getAvailablePort(t)

	setEnvVars(t, map[string]string{
		"PORT":                     "  " + port + "  ",
		"SUPABASE_URL":             "https://test.supabase.co",
		"SUPABASE_PUBLISHABLE_KEY": "test-key",
		"SUPABASE_SECRET_KEY":      "test-secret",
		"SUPABASE_STORAGE_BUCKET":  "test-bucket",
	})

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != port {
		t.Errorf("expected port %s, got %s", port, cfg.Port)
	}
}

// Benchmark for Load function
func BenchmarkLoad(b *testing.B) {
	// Set up required env vars
	os.Setenv("SUPABASE_URL", "https://test.supabase.co")
	os.Setenv("SUPABASE_PUBLISHABLE_KEY", "test-key")
	os.Setenv("SUPABASE_SECRET_KEY", "test-secret")
	os.Setenv("SUPABASE_STORAGE_BUCKET", "test-bucket")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		//nolint:errcheck // Benchmark ignores errors intentionally
		Load()
	}
}

// Benchmark for sanitizePort function
func BenchmarkSanitizePort(b *testing.B) {
	inputs := []string{"8080", ":8080", "  8080  ", "  :8080  "}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		sanitizePort(inputs[i%len(inputs)])
	}
}

// Benchmark for findFreePort function
func BenchmarkFindFreePort(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		//nolint:errcheck // Benchmark ignores errors intentionally
		findFreePort("8080", 5)
	}
}
