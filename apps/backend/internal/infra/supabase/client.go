package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// Client provides access to Supabase Auth / Storage APIs.
type Client struct {
	baseURL    string
	anonKey    string
	serviceKey string
	jwtSecret  string
	httpClient *http.Client
}

// NewClient creates a Supabase client. Empty values keep the client inert but callable (it will return errors on usage).
func NewClient(baseURL, anonKey, serviceKey, jwtSecret string) *Client {
	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		anonKey:    anonKey,
		serviceKey: serviceKey,
		jwtSecret:  jwtSecret,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) authEndpoint(p string) string {
	return fmt.Sprintf("%s/auth/v1%s", c.baseURL, ensureLeadingSlash(p))
}

func (c *Client) storageEndpoint(p string) string {
	return fmt.Sprintf("%s/storage/v1%s", c.baseURL, ensureLeadingSlash(p))
}

func ensureLeadingSlash(p string) string {
	if strings.HasPrefix(p, "/") {
		return p
	}
	return "/" + p
}

type supabaseError struct {
	Message string `json:"message"`
	Err     string `json:"error"`
}

func (e supabaseError) Error() string {
	switch {
	case e.Message != "":
		return e.Message
	case e.Err != "":
		return e.Err
	default:
		return "supabase error"
	}
}

func decodeSupabaseError(resp *http.Response) error {
	defer resp.Body.Close()
	var supErr supabaseError
	if err := json.NewDecoder(resp.Body).Decode(&supErr); err != nil {
		return fmt.Errorf("supabase responded with status %d", resp.StatusCode)
	}
	if supErr.Message == "" && supErr.Err == "" {
		return fmt.Errorf("supabase responded with status %d", resp.StatusCode)
	}
	return supErr
}

// Signup creates a new user via Supabase Admin API.
func (c *Client) Signup(ctx context.Context, input output.AuthSignupInput) (*output.AuthUser, error) {
	if c.baseURL == "" || c.serviceKey == "" {
		return nil, errors.New("supabase admin api not configured")
	}

	payload := map[string]any{
		"email":         input.Email,
		"password":      input.Password,
		"email_confirm": true,
		"user_metadata": map[string]string{
			"name": input.Name,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.authEndpoint("/admin/users"), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.serviceKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseError(resp)
	}

	var result struct {
		ID          string `json:"id"`
		Email       string `json:"email"`
		AppMetadata struct {
			Role string `json:"role"`
		} `json:"app_metadata"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	role := result.AppMetadata.Role
	if role == "" {
		role = "user"
	}

	return &output.AuthUser{
		ID:    result.ID,
		Email: result.Email,
		Role:  role,
	}, nil
}

// Login executes the password grant flow against Supabase Auth.
func (c *Client) Login(ctx context.Context, input output.AuthLoginInput) (*output.AuthSession, error) {
	if c.baseURL == "" || (c.anonKey == "" && c.serviceKey == "") {
		return nil, errors.New("supabase auth api not configured")
	}

	payload := map[string]string{
		"email":    input.Email,
		"password": input.Password,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	endpoint := c.authEndpoint("/token") + "?grant_type=password"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	key := c.anonKey
	if key == "" {
		key = c.serviceKey
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", key))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseError(resp)
	}

	var result struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
		ExpiresIn    int    `json:"expires_in"`
		User         struct {
			ID           string `json:"id"`
			Email        string `json:"email"`
			UserMetadata struct {
				Role string `json:"role"`
			} `json:"user_metadata"`
			AppMetadata struct {
				Role string `json:"role"`
			} `json:"app_metadata"`
		} `json:"user"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	role := result.User.AppMetadata.Role
	if role == "" {
		role = result.User.UserMetadata.Role
	}
	if role == "" {
		role = "user"
	}

	return &output.AuthSession{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		TokenType:    result.TokenType,
		ExpiresIn:    result.ExpiresIn,
		User: output.AuthUser{
			ID:    result.User.ID,
			Email: result.User.Email,
			Role:  role,
		},
	}, nil
}

type supabaseClaims struct {
	Role  string `json:"role"`
	Email string `json:"email"`
	jwt.RegisteredClaims
}

// Verify validates a Supabase JWT using the configured secret.
func (c *Client) Verify(token string) (*security.TokenClaims, error) {
	if c.jwtSecret == "" {
		return nil, errors.New("supabase jwt secret not configured")
	}

	claims := &supabaseClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %s", t.Header["alg"])
		}
		return []byte(c.jwtSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("token verify failed: %w", err)
	}
	if !parsed.Valid {
		return nil, fmt.Errorf("token is invalid")
	}

	userID := claims.Subject
	if userID == "" {
		return nil, fmt.Errorf("token missing sub claim")
	}

	role := claims.Role
	if role == "" {
		role = "user"
	}

	return &security.TokenClaims{
		UserID: userID,
		Role:   role,
		Email:  claims.Email,
	}, nil
}

// GenerateSignedUploadURL creates a signed upload URL for Supabase Storage.
func (c *Client) GenerateSignedUploadURL(ctx context.Context, bucket, objectPath, contentType string, expiresIn time.Duration) (*output.SignedUploadURL, error) {
	if c.baseURL == "" || c.serviceKey == "" {
		return nil, errors.New("supabase storage api not configured")
	}
	if bucket == "" {
		return nil, errors.New("bucket is required")
	}

	target := fmt.Sprintf("/object/upload/sign/%s/%s", bucket, url.PathEscape(objectPath))
	payload := map[string]any{
		"expiresIn":   int(expiresIn.Seconds()),
		"contentType": contentType,
		"upsert":      true,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.storageEndpoint(target), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.serviceKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseError(resp)
	}

	var result struct {
		SignedURL string `json:"signedUrl"`
		Path      string `json:"path"`
		Token     string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	urlStr := result.SignedURL
	if strings.HasPrefix(urlStr, "/") {
		urlStr = c.baseURL + urlStr
	}

	return &output.SignedUploadURL{
		URL:         urlStr,
		Path:        path.Join(bucket, objectPath),
		Token:       result.Token,
		ExpiresIn:   expiresIn,
		ContentType: contentType,
	}, nil
}
