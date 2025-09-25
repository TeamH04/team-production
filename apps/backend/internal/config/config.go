package config

import (
	"os"
	"strings"
)

type Config struct {
	Port          string
	AllowOrigins  []string
	GoogleMapsKey string
	DBURL         string
}

func Load() *Config {
	c := &Config{
		Port:  getenv("PORT", "8080"),
		DBURL: os.Getenv("DATABASE_URL"),
	}
	if v := os.Getenv("CORS_ALLOW_ORIGIN"); v != "" {
		parts := strings.Split(v, ",")
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		c.AllowOrigins = parts
	} else {
		c.AllowOrigins = []string{"*"}
	}
	return c
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
