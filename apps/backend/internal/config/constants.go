package config

import "time"

// SignedURLTTL is the TTL for signed URLs
const SignedURLTTL = 15 * time.Minute

// HTTPClientTimeout is the timeout for HTTP client requests
const HTTPClientTimeout = 10 * time.Second

// JWKSCacheTTL is the TTL for JWKS cache
const JWKSCacheTTL = 10 * time.Minute

// DBConnMaxLifetime is the maximum lifetime of a database connection
const DBConnMaxLifetime = 30 * time.Minute
