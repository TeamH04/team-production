package handlers

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

const (
	testURL1       = "https://example.com/1"
	testURL2       = "https://example.com/2"
	testSignedURL1 = "https://example.com/signed/key1"
	testSignedURL2 = "https://example.com/signed/key2"
	testKey1       = "key1"
	testKey2       = "key2"
)

// mockStorageProvider implements output.StorageProvider for testing
type mockStorageProvider struct {
	signedURLs   map[string]string
	errorsByKey  map[string]error
	defaultError error
	returnNil    bool
	returnEmpty  bool
}

func (m *mockStorageProvider) CreateSignedUpload(ctx context.Context, bucket, objectPath, contentType string, expiresIn time.Duration, upsert bool) (*output.SignedUpload, error) {
	return nil, nil
}

func (m *mockStorageProvider) CreateSignedDownload(ctx context.Context, bucket, objectPath string, expiresIn time.Duration) (*output.SignedDownload, error) {
	if m.errorsByKey != nil {
		if err, ok := m.errorsByKey[objectPath]; ok {
			return nil, err
		}
	}
	if m.returnNil {
		return nil, nil
	}
	if m.returnEmpty {
		return &output.SignedDownload{URL: ""}, nil
	}
	if m.defaultError != nil {
		return nil, m.defaultError
	}
	if m.signedURLs != nil {
		if url, ok := m.signedURLs[objectPath]; ok {
			return &output.SignedDownload{URL: url}, nil
		}
	}
	return &output.SignedDownload{URL: "https://example.com/signed/" + objectPath}, nil
}

// --- attachSignedURLsToFileResponses Tests ---

func TestAttachSignedURLsToFileResponses_NilStorage(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
	}

	// Should not panic and should not modify files
	attachSignedURLsToFileResponses(context.Background(), nil, "bucket", files)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil when storage is nil")
	}
}

func TestAttachSignedURLsToFileResponses_EmptyBucket(t *testing.T) {
	storage := &mockStorageProvider{}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "", files)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil when bucket is empty")
	}
}

func TestAttachSignedURLsToFileResponses_EmptyFiles(t *testing.T) {
	storage := &mockStorageProvider{}
	files := []presenter.FileResponse{}

	// Should not panic
	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)
}

func TestAttachSignedURLsToFileResponses_Success(t *testing.T) {
	storage := &mockStorageProvider{
		signedURLs: map[string]string{
			testKey1: testSignedURL1,
			testKey2: testSignedURL2,
		},
	}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
		{FileID: "file-2", ObjectKey: testKey2},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	if files[0].URL == nil || *files[0].URL != testSignedURL1 {
		t.Errorf("expected URL to be signed, got %v", files[0].URL)
	}
	if files[1].URL == nil || *files[1].URL != testSignedURL2 {
		t.Errorf("expected URL to be signed, got %v", files[1].URL)
	}
}

func TestAttachSignedURLsToFileResponses_EmptyObjectKey(t *testing.T) {
	storage := &mockStorageProvider{}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: ""},
		{FileID: "file-2", ObjectKey: testKey2},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	// Empty key should be skipped
	if files[0].URL != nil {
		t.Error("expected URL to remain nil for empty object key")
	}
	// Non-empty key should be signed
	if files[1].URL == nil {
		t.Error("expected URL to be signed for non-empty object key")
	}
}

func TestAttachSignedURLsToFileResponses_WhitespaceOnlyKey(t *testing.T) {
	storage := &mockStorageProvider{}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: "   "},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil for whitespace-only object key")
	}
}

func TestAttachSignedURLsToFileResponses_StorageError(t *testing.T) {
	storage := &mockStorageProvider{
		defaultError: errors.New("storage error"),
	}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	// URL should remain nil on error
	if files[0].URL != nil {
		t.Error("expected URL to remain nil on storage error")
	}
}

func TestAttachSignedURLsToFileResponses_StorageReturnsNil(t *testing.T) {
	storage := &mockStorageProvider{
		returnNil: true,
	}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil when storage returns nil")
	}
}

func TestAttachSignedURLsToFileResponses_StorageReturnsEmptyURL(t *testing.T) {
	storage := &mockStorageProvider{
		returnEmpty: true,
	}
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil when storage returns empty URL")
	}
}

func TestAttachSignedURLsToFileResponses_DuplicateKeys(t *testing.T) {
	callCount := 0
	storage := &mockStorageProvider{
		signedURLs: map[string]string{
			testKey1: testSignedURL1,
		},
	}

	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
		{FileID: "file-2", ObjectKey: testKey1}, // Duplicate key
	}

	attachSignedURLsToFileResponses(context.Background(), storage, "bucket", files)

	// Both files should have the same signed URL
	if files[0].URL == nil || *files[0].URL != testSignedURL1 {
		t.Errorf("expected first file URL to be signed, got %v", files[0].URL)
	}
	if files[1].URL == nil || *files[1].URL != testSignedURL1 {
		t.Errorf("expected second file URL to be signed (same key), got %v", files[1].URL)
	}
	_ = callCount
}

// --- normalizeAndSignImageURLs Tests ---

func TestNormalizeAndSignImageURLs_EmptySlice(t *testing.T) {
	result := normalizeAndSignImageURLs(context.Background(), nil, "bucket", []string{})

	if result == nil {
		t.Error("expected empty slice, got nil")
	}
	if len(result) != 0 {
		t.Errorf("expected empty slice, got %d elements", len(result))
	}
}

func TestNormalizeAndSignImageURLs_NilStorage(t *testing.T) {
	input := []string{testKey1, testKey2}

	result := normalizeAndSignImageURLs(context.Background(), nil, "bucket", input)

	// Should return copy of input
	if len(result) != 2 {
		t.Errorf("expected 2 elements, got %d", len(result))
	}
	if result[0] != testKey1 || result[1] != testKey2 {
		t.Errorf("expected original values, got %v", result)
	}
}

func TestNormalizeAndSignImageURLs_EmptyBucket(t *testing.T) {
	storage := &mockStorageProvider{}
	input := []string{testKey1}

	result := normalizeAndSignImageURLs(context.Background(), storage, "", input)

	if result[0] != testKey1 {
		t.Errorf("expected original value when bucket is empty, got %s", result[0])
	}
}

func TestNormalizeAndSignImageURLs_WithURLs(t *testing.T) {
	storage := &mockStorageProvider{
		signedURLs: map[string]string{
			testKey1: testSignedURL1,
		},
	}
	input := []string{
		"https://example.com/already-signed",
		testKey1,
		"http://another.com/url",
	}

	result := normalizeAndSignImageURLs(context.Background(), storage, "bucket", input)

	// URLs should remain unchanged
	if result[0] != "https://example.com/already-signed" {
		t.Errorf("expected https URL to remain unchanged, got %s", result[0])
	}
	// Key should be signed
	if result[1] != testSignedURL1 {
		t.Errorf("expected key to be signed, got %s", result[1])
	}
	// http URL should remain unchanged
	if result[2] != "http://another.com/url" {
		t.Errorf("expected http URL to remain unchanged, got %s", result[2])
	}
}

func TestNormalizeAndSignImageURLs_AllURLs(t *testing.T) {
	storage := &mockStorageProvider{}
	input := []string{
		testURL1,
		testURL2,
	}

	result := normalizeAndSignImageURLs(context.Background(), storage, "bucket", input)

	// All URLs should remain unchanged (no signing needed)
	if result[0] != input[0] || result[1] != input[1] {
		t.Errorf("expected URLs to remain unchanged, got %v", result)
	}
}

func TestNormalizeAndSignImageURLs_EmptyAndWhitespaceValues(t *testing.T) {
	storage := &mockStorageProvider{
		signedURLs: map[string]string{
			testKey1: testSignedURL1,
		},
	}
	input := []string{
		"",
		"   ",
		testKey1,
	}

	result := normalizeAndSignImageURLs(context.Background(), storage, "bucket", input)

	// Empty strings should remain empty
	if result[0] != "" {
		t.Errorf("expected empty string to remain empty, got %s", result[0])
	}
	// Whitespace should remain whitespace
	if result[1] != "   " {
		t.Errorf("expected whitespace to remain unchanged, got %s", result[1])
	}
	// Key should be signed
	if result[2] != testSignedURL1 {
		t.Errorf("expected key to be signed, got %s", result[2])
	}
}

func TestNormalizeAndSignImageURLs_StorageError(t *testing.T) {
	storage := &mockStorageProvider{
		defaultError: errors.New("storage error"),
	}
	input := []string{testKey1}

	result := normalizeAndSignImageURLs(context.Background(), storage, "bucket", input)

	// Key should remain unchanged on error
	if result[0] != testKey1 {
		t.Errorf("expected key to remain unchanged on error, got %s", result[0])
	}
}

func TestNormalizeAndSignImageURLs_DuplicateKeys(t *testing.T) {
	storage := &mockStorageProvider{
		signedURLs: map[string]string{
			testKey1: testSignedURL1,
		},
	}
	input := []string{testKey1, testKey1, testKey1}

	result := normalizeAndSignImageURLs(context.Background(), storage, "bucket", input)

	for i, r := range result {
		if r != testSignedURL1 {
			t.Errorf("expected result[%d] to be signed, got %s", i, r)
		}
	}
}

// --- collectObjectKeys Tests ---

func TestCollectObjectKeys_EmptySlice(t *testing.T) {
	files := []presenter.FileResponse{}

	keys := collectObjectKeys(files)

	if len(keys) != 0 {
		t.Errorf("expected empty slice, got %d elements", len(keys))
	}
}

func TestCollectObjectKeys_SkipsEmptyKeys(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: ""},
		{FileID: "file-2", ObjectKey: testKey2},
		{FileID: "file-3", ObjectKey: "   "}, // whitespace only
	}

	keys := collectObjectKeys(files)

	if len(keys) != 1 {
		t.Errorf("expected 1 key, got %d", len(keys))
	}
	if keys[0] != testKey2 {
		t.Errorf("expected 'key2', got %s", keys[0])
	}
}

func TestCollectObjectKeys_DeduplicatesKeys(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
		{FileID: "file-2", ObjectKey: testKey1},
		{FileID: "file-3", ObjectKey: testKey2},
	}

	keys := collectObjectKeys(files)

	if len(keys) != 2 {
		t.Errorf("expected 2 unique keys, got %d", len(keys))
	}
}

// --- collectUnsignedKeys Tests ---

func TestCollectUnsignedKeys_EmptySlice(t *testing.T) {
	values := []string{}

	keys := collectUnsignedKeys(values)

	if len(keys) != 0 {
		t.Errorf("expected empty slice, got %d elements", len(keys))
	}
}

func TestCollectUnsignedKeys_SkipsURLs(t *testing.T) {
	values := []string{
		testURL1,
		"http://example.com/2",
		testKey1,
	}

	keys := collectUnsignedKeys(values)

	if len(keys) != 1 {
		t.Errorf("expected 1 key, got %d", len(keys))
	}
	if keys[0] != testKey1 {
		t.Errorf("expected 'key1', got %s", keys[0])
	}
}

func TestCollectUnsignedKeys_SkipsEmpty(t *testing.T) {
	values := []string{"", "   ", testKey1}

	keys := collectUnsignedKeys(values)

	if len(keys) != 1 {
		t.Errorf("expected 1 key, got %d", len(keys))
	}
}

func TestCollectUnsignedKeys_Deduplicates(t *testing.T) {
	values := []string{testKey1, testKey1, testKey2}

	keys := collectUnsignedKeys(values)

	if len(keys) != 2 {
		t.Errorf("expected 2 unique keys, got %d", len(keys))
	}
}

// --- looksLikeURL Tests ---

func TestLooksLikeURL_HTTPS(t *testing.T) {
	if !looksLikeURL("https://example.com") {
		t.Error("expected https:// to be recognized as URL")
	}
}

func TestLooksLikeURL_HTTP(t *testing.T) {
	if !looksLikeURL("http://example.com") {
		t.Error("expected http:// to be recognized as URL")
	}
}

func TestLooksLikeURL_NotURL(t *testing.T) {
	tests := []string{
		"key1",
		"path/to/file",
		"ftp://example.com",
		"",
		"HTTPS://example.com", // case sensitive
	}

	for _, test := range tests {
		if looksLikeURL(test) {
			t.Errorf("expected %q to NOT be recognized as URL", test)
		}
	}
}

// --- applySignedURLsToFiles Tests ---

func TestApplySignedURLsToFiles_EmptyFiles(t *testing.T) {
	files := []presenter.FileResponse{}
	urlByKey := map[string]string{testKey1: "url1"}

	// Should not panic
	applySignedURLsToFiles(files, urlByKey)
}

func TestApplySignedURLsToFiles_EmptyMap(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
	}
	urlByKey := map[string]string{}

	applySignedURLsToFiles(files, urlByKey)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil with empty map")
	}
}

func TestApplySignedURLsToFiles_SkipsEmptyKey(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: ""},
	}
	urlByKey := map[string]string{"": "url1"}

	applySignedURLsToFiles(files, urlByKey)

	if files[0].URL != nil {
		t.Error("expected URL to remain nil for empty key")
	}
}

func TestApplySignedURLsToFiles_AppliesURLs(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1},
		{FileID: "file-2", ObjectKey: testKey2},
	}
	urlByKey := map[string]string{
		testKey1: testURL1,
		testKey2: testURL2,
	}

	applySignedURLsToFiles(files, urlByKey)

	if files[0].URL == nil || *files[0].URL != testURL1 {
		t.Errorf("expected file 1 URL to be set, got %v", files[0].URL)
	}
	if files[1].URL == nil || *files[1].URL != testURL2 {
		t.Errorf("expected file 2 URL to be set, got %v", files[1].URL)
	}
}

// --- applySignedURLsToImages Tests ---

func TestApplySignedURLsToImages_EmptySlice(t *testing.T) {
	values := []string{}
	urlByKey := map[string]string{testKey1: "url1"}

	// Should not panic
	applySignedURLsToImages(values, urlByKey)
}

func TestApplySignedURLsToImages_SkipsURLs(t *testing.T) {
	values := []string{"https://example.com/existing"}
	urlByKey := map[string]string{"https://example.com/existing": "should-not-apply"}

	applySignedURLsToImages(values, urlByKey)

	if values[0] != "https://example.com/existing" {
		t.Errorf("expected URL to remain unchanged, got %s", values[0])
	}
}

func TestApplySignedURLsToImages_SkipsEmpty(t *testing.T) {
	values := []string{"", "   "}
	urlByKey := map[string]string{"": "url1", "   ": "url2"}

	applySignedURLsToImages(values, urlByKey)

	if values[0] != "" || values[1] != "   " {
		t.Errorf("expected empty values to remain unchanged, got %v", values)
	}
}

func TestApplySignedURLsToImages_AppliesURLs(t *testing.T) {
	values := []string{testKey1, testKey2}
	urlByKey := map[string]string{
		testKey1: testURL1,
		testKey2: testURL2,
	}

	applySignedURLsToImages(values, urlByKey)

	if values[0] != testURL1 {
		t.Errorf("expected value 1 to be replaced, got %s", values[0])
	}
	if values[1] != testURL2 {
		t.Errorf("expected value 2 to be replaced, got %s", values[1])
	}
}

// --- collectReviewFiles Tests ---

func TestCollectReviewFiles_EmptyReviews(t *testing.T) {
	reviews := []presenter.ReviewResponse{}

	files := collectReviewFiles(reviews)

	if len(files) != 0 {
		t.Errorf("expected empty slice, got %d elements", len(files))
	}
}

func TestCollectReviewFiles_ReviewsWithNoFiles(t *testing.T) {
	reviews := []presenter.ReviewResponse{
		{ReviewID: "review-1", Files: nil},
		{ReviewID: "review-2", Files: []presenter.FileResponse{}},
	}

	files := collectReviewFiles(reviews)

	if len(files) != 0 {
		t.Errorf("expected empty slice, got %d elements", len(files))
	}
}

func TestCollectReviewFiles_CollectsAllFiles(t *testing.T) {
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
				{FileID: "file-2", ObjectKey: testKey2},
			},
		},
		{
			ReviewID: "review-2",
			Files: []presenter.FileResponse{
				{FileID: "file-3", ObjectKey: "key3"},
			},
		},
	}

	files := collectReviewFiles(reviews)

	if len(files) != 3 {
		t.Errorf("expected 3 files, got %d", len(files))
	}
}

// --- buildFileURLPointerMap Tests ---

func TestBuildFileURLPointerMap_EmptyFiles(t *testing.T) {
	files := []presenter.FileResponse{}

	urlMap := buildFileURLPointerMap(files)

	if len(urlMap) != 0 {
		t.Errorf("expected empty map, got %d elements", len(urlMap))
	}
}

func TestBuildFileURLPointerMap_SkipsEmptyKey(t *testing.T) {
	url := testURL1
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: "", URL: &url},
	}

	urlMap := buildFileURLPointerMap(files)

	if len(urlMap) != 0 {
		t.Errorf("expected empty map (empty key skipped), got %d elements", len(urlMap))
	}
}

func TestBuildFileURLPointerMap_SkipsNilURL(t *testing.T) {
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1, URL: nil},
	}

	urlMap := buildFileURLPointerMap(files)

	if len(urlMap) != 0 {
		t.Errorf("expected empty map (nil URL skipped), got %d elements", len(urlMap))
	}
}

func TestBuildFileURLPointerMap_SkipsEmptyURL(t *testing.T) {
	emptyURL := ""
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1, URL: &emptyURL},
	}

	urlMap := buildFileURLPointerMap(files)

	if len(urlMap) != 0 {
		t.Errorf("expected empty map (empty URL skipped), got %d elements", len(urlMap))
	}
}

func TestBuildFileURLPointerMap_BuildsMap(t *testing.T) {
	url1 := testURL1
	url2 := testURL2
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1, URL: &url1},
		{FileID: "file-2", ObjectKey: testKey2, URL: &url2},
	}

	urlMap := buildFileURLPointerMap(files)

	if len(urlMap) != 2 {
		t.Errorf("expected 2 entries, got %d", len(urlMap))
	}
	if urlMap[testKey1] == nil || *urlMap[testKey1] != url1 {
		t.Errorf("expected key1 to map to %s, got %v", url1, urlMap[testKey1])
	}
}

func TestBuildFileURLPointerMap_DeduplicatesKeys(t *testing.T) {
	url1 := testURL1
	url2 := testURL2
	files := []presenter.FileResponse{
		{FileID: "file-1", ObjectKey: testKey1, URL: &url1},
		{FileID: "file-2", ObjectKey: testKey1, URL: &url2}, // Duplicate key
	}

	urlMap := buildFileURLPointerMap(files)

	if len(urlMap) != 1 {
		t.Errorf("expected 1 entry (deduplicated), got %d", len(urlMap))
	}
	// First entry wins
	if *urlMap[testKey1] != url1 {
		t.Errorf("expected first URL to be preserved, got %s", *urlMap[testKey1])
	}
}

// --- applySignedURLsToReviews Tests ---

func TestApplySignedURLsToReviews_EmptyReviews(t *testing.T) {
	reviews := []presenter.ReviewResponse{}
	url := testURL1
	urlByKey := map[string]*string{testKey1: &url}

	// Should not panic
	applySignedURLsToReviews(reviews, urlByKey)
}

func TestApplySignedURLsToReviews_SkipsEmptyKey(t *testing.T) {
	url := testURL1
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: ""},
			},
		},
	}
	urlByKey := map[string]*string{"": &url}

	applySignedURLsToReviews(reviews, urlByKey)

	if reviews[0].Files[0].URL != nil {
		t.Error("expected URL to remain nil for empty key")
	}
}

func TestApplySignedURLsToReviews_SkipsNilURL(t *testing.T) {
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
			},
		},
	}
	urlByKey := map[string]*string{testKey1: nil}

	applySignedURLsToReviews(reviews, urlByKey)

	if reviews[0].Files[0].URL != nil {
		t.Error("expected URL to remain nil when map value is nil")
	}
}

func TestApplySignedURLsToReviews_SkipsEmptyURLValue(t *testing.T) {
	emptyURL := ""
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
			},
		},
	}
	urlByKey := map[string]*string{testKey1: &emptyURL}

	applySignedURLsToReviews(reviews, urlByKey)

	if reviews[0].Files[0].URL != nil {
		t.Error("expected URL to remain nil when map value is empty string")
	}
}

func TestApplySignedURLsToReviews_AppliesURLs(t *testing.T) {
	url1 := testURL1
	url2 := testURL2
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
				{FileID: "file-2", ObjectKey: testKey2},
			},
		},
	}
	urlByKey := map[string]*string{
		testKey1: &url1,
		testKey2: &url2,
	}

	applySignedURLsToReviews(reviews, urlByKey)

	if reviews[0].Files[0].URL == nil || *reviews[0].Files[0].URL != url1 {
		t.Errorf("expected file 1 URL to be set, got %v", reviews[0].Files[0].URL)
	}
	if reviews[0].Files[1].URL == nil || *reviews[0].Files[1].URL != url2 {
		t.Errorf("expected file 2 URL to be set, got %v", reviews[0].Files[1].URL)
	}
}

// --- attachSignedURLsToReviewResponses Tests ---

func TestAttachSignedURLsToReviewResponses_NilStorage(t *testing.T) {
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
			},
		},
	}

	attachSignedURLsToReviewResponses(context.Background(), nil, "bucket", reviews)

	if reviews[0].Files[0].URL != nil {
		t.Error("expected URL to remain nil when storage is nil")
	}
}

func TestAttachSignedURLsToReviewResponses_EmptyBucket(t *testing.T) {
	storage := &mockStorageProvider{}
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
			},
		},
	}

	attachSignedURLsToReviewResponses(context.Background(), storage, "", reviews)

	if reviews[0].Files[0].URL != nil {
		t.Error("expected URL to remain nil when bucket is empty")
	}
}

func TestAttachSignedURLsToReviewResponses_EmptyReviews(t *testing.T) {
	storage := &mockStorageProvider{}
	reviews := []presenter.ReviewResponse{}

	// Should not panic
	attachSignedURLsToReviewResponses(context.Background(), storage, "bucket", reviews)
}

func TestAttachSignedURLsToReviewResponses_NoFiles(t *testing.T) {
	storage := &mockStorageProvider{}
	reviews := []presenter.ReviewResponse{
		{ReviewID: "review-1", Files: nil},
		{ReviewID: "review-2", Files: []presenter.FileResponse{}},
	}

	// Should not panic and should return early
	attachSignedURLsToReviewResponses(context.Background(), storage, "bucket", reviews)
}

func TestAttachSignedURLsToReviewResponses_Success(t *testing.T) {
	storage := &mockStorageProvider{
		signedURLs: map[string]string{
			testKey1: testSignedURL1,
			testKey2: testSignedURL2,
		},
	}
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
			},
		},
		{
			ReviewID: "review-2",
			Files: []presenter.FileResponse{
				{FileID: "file-2", ObjectKey: testKey2},
			},
		},
	}

	attachSignedURLsToReviewResponses(context.Background(), storage, "bucket", reviews)

	if reviews[0].Files[0].URL == nil || *reviews[0].Files[0].URL != testSignedURL1 {
		t.Errorf("expected review 1 file URL to be signed, got %v", reviews[0].Files[0].URL)
	}
	if reviews[1].Files[0].URL == nil || *reviews[1].Files[0].URL != testSignedURL2 {
		t.Errorf("expected review 2 file URL to be signed, got %v", reviews[1].Files[0].URL)
	}
}

func TestAttachSignedURLsToReviewResponses_StorageError_AllFail(t *testing.T) {
	// When storage errors for all keys, the urlByKey map will be empty
	// and the function should return early without applying any URLs
	storage := &mockStorageProvider{
		defaultError: errors.New("storage error"),
	}
	reviews := []presenter.ReviewResponse{
		{
			ReviewID: "review-1",
			Files: []presenter.FileResponse{
				{FileID: "file-1", ObjectKey: testKey1},
			},
		},
	}

	attachSignedURLsToReviewResponses(context.Background(), storage, "bucket", reviews)

	// URL should remain nil when storage fails
	if reviews[0].Files[0].URL != nil {
		t.Error("expected URL to remain nil when storage fails for all keys")
	}
}
