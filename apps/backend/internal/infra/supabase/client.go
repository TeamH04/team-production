package supabase

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
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
	httpClient *http.Client
	jwksMu     sync.Mutex
	jwksCached *jwksCache
}

// NewClient creates a Supabase client. Empty values keep the client inert but callable (it will return errors on usage).
func NewClient(baseURL, publishableKey, secretKey string) *Client {
	return &Client{
		baseURL:    strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		anonKey:    strings.TrimSpace(publishableKey),
		serviceKey: strings.TrimSpace(secretKey),
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type jwksCache struct {
	fetchedAt time.Time
	keysByKID map[string]*ecdsa.PublicKey
}

type jwksDocument struct {
	Keys []struct {
		Kty string `json:"kty"`
		Kid string `json:"kid"`
		Crv string `json:"crv"`
		X   string `json:"x"`
		Y   string `json:"y"`
		// ほかのフィールドが来ても無視
	} `json:"keys"`
}

func (c *Client) jwksURL() string {
	return fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", c.baseURL)
}

func base64URLDecodeBigInt(s string) (*big.Int, error) {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	return new(big.Int).SetBytes(b), nil
}

func (c *Client) fetchJWKS(ctx context.Context) (map[string]*ecdsa.PublicKey, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.jwksURL(), nil)
	if err != nil {
		return nil, err
	}
	key := c.authKey()
	if key != "" {
		req.Header.Set("apikey", key)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("jwks fetch failed: status=%d body=%s", resp.StatusCode, string(body))
	}

	var doc jwksDocument
	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, err
	}

	keys := map[string]*ecdsa.PublicKey{}
	for _, k := range doc.Keys {
		if k.Kty != "EC" || k.Crv != "P-256" || k.Kid == "" || k.X == "" || k.Y == "" {
			continue
		}
		x, err := base64URLDecodeBigInt(k.X)
		if err != nil {
			continue
		}
		y, err := base64URLDecodeBigInt(k.Y)
		if err != nil {
			continue
		}
		pub := &ecdsa.PublicKey{
			Curve: elliptic.P256(),
			X:     x,
			Y:     y,
		}
		if !pub.Curve.IsOnCurve(pub.X, pub.Y) {
			continue
		}
		keys[k.Kid] = pub
	}

	if len(keys) == 0 {
		return nil, fmt.Errorf("jwks contains no usable P-256 keys")
	}
	return keys, nil
}

func (c *Client) getPublicKey(ctx context.Context, kid string) (*ecdsa.PublicKey, error) {
	const ttl = 10 * time.Minute

	c.jwksMu.Lock()
	cached := c.jwksCached
	c.jwksMu.Unlock()

	if cached != nil && time.Since(cached.fetchedAt) < ttl {
		if pub, ok := cached.keysByKID[kid]; ok {
			return pub, nil
		}
	}

	keys, err := c.fetchJWKS(ctx)
	if err != nil {
		return nil, err
	}

	c.jwksMu.Lock()
	c.jwksCached = &jwksCache{fetchedAt: time.Now(), keysByKID: keys}
	c.jwksMu.Unlock()

	pub, ok := keys[kid]
	if !ok {
		return nil, fmt.Errorf("jwks key not found for kid=%s", kid)
	}
	return pub, nil
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

func (c *Client) storageKey() string {
	if strings.TrimSpace(c.serviceKey) != "" {
		return strings.TrimSpace(c.serviceKey)
	}
	return strings.TrimSpace(c.anonKey)
}

func (c *Client) authKey() string {
	if strings.TrimSpace(c.anonKey) != "" {
		return strings.TrimSpace(c.anonKey)
	}
	return strings.TrimSpace(c.serviceKey)
}

func decodeSupabaseErrorFromBody(status int, body []byte) error {
	var supErr supabaseError
	if err := json.Unmarshal(body, &supErr); err != nil {
		return fmt.Errorf("supabase responded with status %d", status)
	}
	if supErr.Message == "" && supErr.Err == "" {
		return fmt.Errorf("supabase responded with status %d", status)
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

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseErrorFromBody(resp.StatusCode, respBody)
	}

	var result struct {
		ID          string `json:"id"`
		Email       string `json:"email"`
		AppMetadata struct {
			Role string `json:"role"`
		} `json:"app_metadata"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
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
	key := c.authKey()
	if c.baseURL == "" || key == "" {
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

	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", key))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseErrorFromBody(resp.StatusCode, respBody)
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
	if err := json.Unmarshal(respBody, &result); err != nil {
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
	Role         string         `json:"role"`
	Email        string         `json:"email"`
	AppMetadata  map[string]any `json:"app_metadata"`
	UserMetadata map[string]any `json:"user_metadata"`
	jwt.RegisteredClaims
}

// Verify validates a Supabase JWT using the configured secret.
func (c *Client) Verify(token string) (*security.TokenClaims, error) {
	if c.baseURL == "" {
		return nil, errors.New("supabase base url not configured")
	}

	claims := &supabaseClaims{}

	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		alg, _ := t.Header["alg"].(string)
		if alg != "ES256" {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}
		kid, _ := t.Header["kid"].(string)
		if kid == "" {
			return nil, fmt.Errorf("token missing kid header")
		}
		return c.getPublicKey(context.Background(), kid)
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

	provider := extractProvider(claims)
	if provider == "" {
		provider = "oauth"
	}

	return &security.TokenClaims{
		UserID:   userID,
		Role:     role,
		Email:    claims.Email,
		Provider: provider,
	}, nil
}

func extractProvider(claims *supabaseClaims) string {
	if claims == nil {
		return ""
	}
	if provider := getStringFromMap(claims.AppMetadata, "provider"); provider != "" {
		return provider
	}
	if provider := getStringFromMap(claims.UserMetadata, "provider"); provider != "" {
		return provider
	}
	if providers := getStringSliceFromMap(claims.AppMetadata, "providers"); len(providers) > 0 {
		return providers[0]
	}
	return ""
}

func getStringFromMap(values map[string]any, key string) string {
	if values == nil {
		return ""
	}
	raw, ok := values[key]
	if !ok {
		return ""
	}
	if s, ok := raw.(string); ok {
		return strings.ToLower(strings.TrimSpace(s))
	}
	return ""
}

func getStringSliceFromMap(values map[string]any, key string) []string {
	if values == nil {
		return nil
	}
	raw, ok := values[key]
	if !ok {
		return nil
	}
	list, ok := raw.([]any)
	if !ok {
		return nil
	}
	result := make([]string, 0, len(list))
	for _, item := range list {
		if s, ok := item.(string); ok {
			trimmed := strings.ToLower(strings.TrimSpace(s))
			if trimmed != "" {
				result = append(result, trimmed)
			}
		}
	}
	return result
}

// escapePathPreserveSlash は objectPath を URL エンコードするが、階層区切りの "/" は保持する。
// Supabase Storage のエンドポイントは "reviews/xxx/file name.jpg" のような階層パスを "/" 区切りで受け取るため、
// 全体に url.PathEscape をかけると "/" まで "%2F" になって階層が壊れてしまう。
// そこで "/" で分割し、各セグメントのみを PathEscape してから "/" で結合する。
func escapePathPreserveSlash(p string) string {
	p = strings.TrimPrefix(strings.TrimSpace(p), "/")
	if p == "" {
		return ""
	}
	parts := strings.Split(p, "/")
	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}
	return strings.Join(parts, "/")
}

func (c *Client) CreateSignedUpload(
	ctx context.Context,
	bucket, objectPath, contentType string,
	expiresIn time.Duration,
	upsert bool,
) (*output.SignedUpload, error) {
	key := c.storageKey()
	if c.baseURL == "" || key == "" {
		return nil, errors.New("supabase storage api not configured")
	}
	if strings.TrimSpace(bucket) == "" {
		return nil, errors.New("bucket is required")
	}
	objectPath = strings.TrimSpace(objectPath)
	if objectPath == "" {
		return nil, errors.New("objectPath is required")
	}
	if expiresIn <= 0 {
		return nil, errors.New("expiresIn must be positive")
	}
	ct := strings.TrimSpace(contentType)

	escapedPath := escapePathPreserveSlash(objectPath)
	target := fmt.Sprintf("/object/upload/sign/%s/%s", bucket, escapedPath)

	payload := map[string]any{
		"expiresIn":   int(expiresIn.Seconds()),
		"contentType": ct,
		"upsert":      upsert,
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
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", key))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseErrorFromBody(resp.StatusCode, respBody)
	}

	var result struct {
		Token string `json:"token"`
		Path  string `json:"path"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	if result.Token == "" {
		var raw map[string]any
		if err := json.Unmarshal(respBody, &raw); err == nil {
			keys := make([]string, 0, len(raw))
			for k := range raw {
				keys = append(keys, k)
			}
			sort.Strings(keys)
			return nil, fmt.Errorf("supabase signed upload missing token (bucket=%s path=%s keys=%v)", bucket, objectPath, keys)
		}
		return nil, fmt.Errorf("supabase signed upload missing token (bucket=%s path=%s)", bucket, objectPath)
	}

	return &output.SignedUpload{
		Bucket:      bucket,
		Path:        objectPath,
		Token:       result.Token,
		ExpiresIn:   expiresIn,
		ContentType: ct,
		Upsert:      upsert,
	}, nil
}

func (c *Client) CreateSignedDownload(ctx context.Context, bucket, objectPath string, expiresIn time.Duration) (*output.SignedDownload, error) {
	key := c.storageKey()
	if c.baseURL == "" || key == "" {
		return nil, errors.New("supabase storage api not configured")
	}
	if strings.TrimSpace(bucket) == "" {
		return nil, errors.New("bucket is required")
	}
	objectPath = strings.TrimSpace(objectPath)
	if objectPath == "" {
		return nil, errors.New("objectPath is required")
	}
	if expiresIn <= 0 {
		return nil, errors.New("expiresIn must be positive")
	}

	escapedPath := escapePathPreserveSlash(objectPath)
	target := fmt.Sprintf("/object/sign/%s/%s", bucket, escapedPath)
	payload := map[string]any{
		"expiresIn": int(expiresIn.Seconds()),
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
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", key))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 300 {
		return nil, decodeSupabaseErrorFromBody(resp.StatusCode, respBody)
	}

	var result struct {
		SignedURL string `json:"signedURL"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	signedURL := strings.TrimSpace(result.SignedURL)
	if signedURL == "" {
		var raw map[string]any
		if err := json.Unmarshal(respBody, &raw); err == nil {
			keys := make([]string, 0, len(raw))
			for k := range raw {
				keys = append(keys, k)
			}
			sort.Strings(keys)
			return nil, fmt.Errorf("supabase signed download missing url (bucket=%s path=%s keys=%v)", bucket, objectPath, keys)
		}
		return nil, fmt.Errorf("supabase signed download missing url (bucket=%s path=%s)", bucket, objectPath)
	}

	urlStr := signedURL
	if strings.HasPrefix(urlStr, "/") {
		urlStr = c.storageEndpoint(urlStr)
	}

	return &output.SignedDownload{
		Bucket:    bucket,
		Path:      objectPath,
		URL:       urlStr,
		ExpiresIn: expiresIn,
	}, nil
}
