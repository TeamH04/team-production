package handlers

import (
	"context"
	"strings"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// isStorageAvailable checks if storage provider and bucket are properly configured.
func isStorageAvailable(storage output.StorageProvider, bucket string) bool {
	return storage != nil && bucket != ""
}

func attachSignedURLsToFileResponses(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	files []presenter.FileResponse,
) {
	if !isStorageAvailable(storage, bucket) || len(files) == 0 {
		return
	}

	keys := collectObjectKeys(files)
	if len(keys) == 0 {
		return
	}

	urlByKey := buildSignedURLMap(ctx, storage, bucket, keys)
	if len(urlByKey) == 0 {
		return
	}

	applySignedURLsToFiles(files, urlByKey)
}

func normalizeAndSignImageURLs(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	imageURLs []string,
) []string {
	if len(imageURLs) == 0 {
		return []string{}
	}
	out := make([]string, len(imageURLs))
	copy(out, imageURLs)

	if !isStorageAvailable(storage, bucket) {
		return out
	}

	keys := collectUnsignedKeys(out)
	if len(keys) == 0 {
		return out
	}

	urlByKey := buildSignedURLMap(ctx, storage, bucket, keys)
	if len(urlByKey) == 0 {
		return out
	}

	applySignedURLsToImages(out, urlByKey)

	return out
}

func attachSignedURLsToStoreResponses(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	stores []presenter.StoreResponse,
) {
	if !isStorageAvailable(storage, bucket) || len(stores) == 0 {
		return
	}

	for i := range stores {
		if stores[i].ThumbnailFile != nil {
			files := []presenter.FileResponse{*stores[i].ThumbnailFile}
			attachSignedURLsToFileResponses(ctx, storage, bucket, files)
			stores[i].ThumbnailFile = &files[0]
		}

		stores[i].ImageUrls = normalizeAndSignImageURLs(ctx, storage, bucket, stores[i].ImageUrls)
	}
}

func attachSignedURLsToReviewResponses(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	reviews []presenter.ReviewResponse,
) {
	if !isStorageAvailable(storage, bucket) || len(reviews) == 0 {
		return
	}

	all := collectReviewFiles(reviews)
	if len(all) == 0 {
		return
	}

	attachSignedURLsToFileResponses(ctx, storage, bucket, all)

	urlByKey := buildFileURLPointerMap(all)
	if len(urlByKey) == 0 {
		return
	}

	applySignedURLsToReviews(reviews, urlByKey)
}

func collectObjectKeys(files []presenter.FileResponse) []string {
	keys := make([]string, 0, len(files))
	seen := make(map[string]struct{}, len(files))
	for _, f := range files {
		key := strings.TrimSpace(f.ObjectKey)
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		keys = append(keys, key)
	}
	return keys
}

func collectUnsignedKeys(values []string) []string {
	keys := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, v := range values {
		s := strings.TrimSpace(v)
		if s == "" || looksLikeURL(s) {
			continue
		}
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		keys = append(keys, s)
	}
	return keys
}

func buildSignedURLMap(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	keys []string,
) map[string]string {
	urlByKey := make(map[string]string, len(keys))
	for _, key := range keys {
		signed, err := storage.CreateSignedDownload(ctx, bucket, key, config.SignedURLTTL)
		if err != nil || signed == nil || signed.URL == "" {
			continue
		}
		urlByKey[key] = signed.URL
	}
	return urlByKey
}

func applySignedURLsToFiles(files []presenter.FileResponse, urlByKey map[string]string) {
	for i := range files {
		key := files[i].ObjectKey
		if key == "" {
			continue
		}
		if url, ok := urlByKey[key]; ok {
			u := url
			files[i].URL = &u
		}
	}
}

func applySignedURLsToImages(values []string, urlByKey map[string]string) {
	for i := range values {
		s := strings.TrimSpace(values[i])
		if s == "" || looksLikeURL(s) {
			continue
		}
		if url, ok := urlByKey[s]; ok {
			values[i] = url
		}
	}
}

func collectReviewFiles(reviews []presenter.ReviewResponse) []presenter.FileResponse {
	total := 0
	for i := range reviews {
		total += len(reviews[i].Files)
	}
	all := make([]presenter.FileResponse, 0, total)
	for i := range reviews {
		if len(reviews[i].Files) == 0 {
			continue
		}
		all = append(all, reviews[i].Files...)
	}
	return all
}

func buildFileURLPointerMap(files []presenter.FileResponse) map[string]*string {
	urlByKey := make(map[string]*string, len(files))
	for i := range files {
		if files[i].ObjectKey == "" || files[i].URL == nil || *files[i].URL == "" {
			continue
		}
		if _, ok := urlByKey[files[i].ObjectKey]; ok {
			continue
		}
		urlByKey[files[i].ObjectKey] = files[i].URL
	}
	return urlByKey
}

func applySignedURLsToReviews(reviews []presenter.ReviewResponse, urlByKey map[string]*string) {
	for i := range reviews {
		for j := range reviews[i].Files {
			key := reviews[i].Files[j].ObjectKey
			if key == "" {
				continue
			}
			if u, ok := urlByKey[key]; ok && u != nil && *u != "" {
				reviews[i].Files[j].URL = u
			}
		}
	}
}

func looksLikeURL(s string) bool {
	return strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://")
}
