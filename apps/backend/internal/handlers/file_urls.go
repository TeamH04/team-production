package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

const signedURLTTL = 15 * time.Minute

func attachSignedURLsToFileResponses(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	files []presenter.FileResponse,
) {
	if storage == nil || bucket == "" || len(files) == 0 {
		return
	}

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

	if len(keys) == 0 {
		return
	}

	urlByKey := make(map[string]string, len(keys))
	for _, key := range keys {
		signed, err := storage.CreateSignedDownload(ctx, bucket, key, signedURLTTL)
		if err != nil || signed == nil || signed.URL == "" {
			continue
		}
		urlByKey[key] = signed.URL
	}

	if len(urlByKey) == 0 {
		return
	}

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

	if storage == nil || bucket == "" {
		return out
	}

	keys := make([]string, 0, len(out))
	seen := make(map[string]struct{}, len(out))
	for _, v := range out {
		s := strings.TrimSpace(v)
		if s == "" {
			continue
		}
		if looksLikeURL(s) {
			continue
		}
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		keys = append(keys, s)
	}

	if len(keys) == 0 {
		return out
	}

	urlByKey := make(map[string]string, len(keys))
	for _, key := range keys {
		signed, err := storage.CreateSignedDownload(ctx, bucket, key, signedURLTTL)
		if err != nil || signed == nil || signed.URL == "" {
			continue
		}
		urlByKey[key] = signed.URL
	}

	if len(urlByKey) == 0 {
		return out
	}

	for i := range out {
		s := strings.TrimSpace(out[i])
		if s == "" || looksLikeURL(s) {
			continue
		}
		if url, ok := urlByKey[s]; ok {
			out[i] = url
		}
	}

	return out
}

func attachSignedURLsToStoreResponses(
	ctx context.Context,
	storage output.StorageProvider,
	bucket string,
	stores []presenter.StoreResponse,
) {
	if storage == nil || bucket == "" || len(stores) == 0 {
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
	if storage == nil || bucket == "" || len(reviews) == 0 {
		return
	}

	all := make([]presenter.FileResponse, 0)
	for i := range reviews {
		if len(reviews[i].Files) == 0 {
			continue
		}
		all = append(all, reviews[i].Files...)
	}

	if len(all) == 0 {
		return
	}

	attachSignedURLsToFileResponses(ctx, storage, bucket, all)

	urlByKey := map[string]*string{}
	for i := range all {
		if all[i].ObjectKey == "" || all[i].URL == nil || *all[i].URL == "" {
			continue
		}
		if _, ok := urlByKey[all[i].ObjectKey]; ok {
			continue
		}
		urlByKey[all[i].ObjectKey] = all[i].URL
	}

	if len(urlByKey) == 0 {
		return
	}

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
