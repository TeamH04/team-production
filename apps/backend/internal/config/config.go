package config

import (
	"errors"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"strings"
)

const (
	defaultDBURL       = "postgres://postgres:postgres@localhost:5432/app?sslmode=disable"
	defaultPort        = "8080"
	fallbackPortChecks = 20
)

type Config struct {
	Port                   string
	AllowOrigins           []string
	GoogleMapsKey          string
	DBURL                  string
	SupabaseURL            string
	SupabaseAnonKey        string
	SupabaseServiceRoleKey string
	SupabaseJWTSecret      string
	SupabaseStorageBucket  string
}

func Load() (*Config, error) {
	cfg := &Config{}

	rawPortEnv := sanitizePort(os.Getenv("PORT"))
	portInput := sanitizePort(getenv("PORT", defaultPort))
	explicit := rawPortEnv != "" && rawPortEnv != defaultPort

	resolvedPort, err := resolvePort(portInput, explicit)
	if err != nil {
		return nil, err
	}
	cfg.Port = resolvedPort

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = defaultDBURL
		log.Printf("warning: DATABASE_URL not set; using default DSN %q", defaultDBURL)
	}
	cfg.DBURL = dbURL

	if v := os.Getenv("CORS_ALLOW_ORIGIN"); v != "" {
		parts := strings.Split(v, ",")
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		cfg.AllowOrigins = parts
	} else {
		cfg.AllowOrigins = []string{"*"}
	}

	cfg.SupabaseURL = os.Getenv("SUPABASE_URL")
	cfg.SupabaseAnonKey = os.Getenv("SUPABASE_ANON_KEY")
	cfg.SupabaseServiceRoleKey = os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	cfg.SupabaseJWTSecret = os.Getenv("SUPABASE_JWT_SECRET")
	cfg.SupabaseStorageBucket = getenv("SUPABASE_STORAGE_BUCKET", "media")

	return cfg, nil
}

func resolvePort(port string, isExplicit bool) (string, error) {
	if port == "" {
		port = defaultPort
	}

	if isExplicit {
		if err := ensurePortAvailable(port); err != nil {
			return "", fmt.Errorf("port %s is unavailable: %w", port, err)
		}
		return port, nil
	}

	freePort, err := findFreePort(port, fallbackPortChecks)
	if err != nil {
		return "", err
	}
	if freePort != port {
		log.Printf("warning: port %s busy; using fallback port %s", port, freePort)
	}
	return freePort, nil
}

func ensurePortAvailable(port string) error {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		return err
	}
	return ln.Close()
}

func findFreePort(startPort string, attempts int) (string, error) {
	start, err := strconv.Atoi(startPort)
	if err != nil {
		return "", fmt.Errorf("invalid port %q: %w", startPort, err)
	}

	for i := 0; i < attempts; i++ {
		candidate := start + i
		ln, err := net.Listen("tcp", fmt.Sprintf(":%d", candidate))
		if err == nil {
			ln.Close()
			return strconv.Itoa(candidate), nil
		}
	}

	return "", errors.New("no available port found")
}

func sanitizePort(port string) string {
	port = strings.TrimSpace(port)
	port = strings.TrimPrefix(port, ":")
	return port
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
