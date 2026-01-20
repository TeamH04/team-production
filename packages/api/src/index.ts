import { DEFAULT_API_BASE_URL } from '@team/constants';

import type {
  ApiFavorite,
  ApiFile,
  ApiMenu,
  ApiRatingDetails,
  ApiReview,
  ApiStation,
  ApiStore,
  ApiUser,
  ReviewSort,
  SignedUploadFile,
  UploadFileInput,
} from '@team/types';

export type {
  ApiFavorite,
  ApiFile,
  ApiMenu,
  ApiRatingDetails,
  ApiReview,
  ApiStation,
  ApiStore,
  ApiUser,
  ReviewSort,
  SignedUploadFile,
  UploadFileInput,
};

type UploadResponse = {
  files: SignedUploadFile[];
};

type Fetcher = typeof fetch;
type FetchOptions = Parameters<Fetcher>[1];
type HeaderInit = NonNullable<FetchOptions>['headers'];

export type ApiClientOptions = {
  baseUrl: string;
  fetcher?: Fetcher;
  defaultHeaders?: HeaderInit;
  defaultFetchOptions?: FetchOptions;
};

export type ApiClient = ReturnType<typeof createApiClient>;

function appendHeaders(target: Record<string, string>, source?: HeaderInit): void {
  if (!source) return;
  if (source instanceof Headers) {
    source.forEach((value, key) => {
      target[key] = value;
    });
    return;
  }
  if (Array.isArray(source)) {
    source.forEach(([key, value]) => {
      target[key] = value;
    });
    return;
  }
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value;
  });
}

function mergeHeaders(base?: HeaderInit, extra?: HeaderInit): HeaderInit | undefined {
  if (!base && !extra) return undefined;
  const headers: Record<string, string> = {};
  appendHeaders(headers, base);
  appendHeaders(headers, extra);
  return headers;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetcher = options.fetcher ?? fetch;
  const defaultHeaders = options.defaultHeaders;
  const defaultFetchOptions = options.defaultFetchOptions;

  function buildHeaders(
    accessToken?: string,
    extra?: HeaderInit,
    includeJsonContentType = false,
  ): HeaderInit {
    const headers: Record<string, string> = {};
    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }
    appendHeaders(headers, defaultHeaders);
    appendHeaders(headers, extra);
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  }

  async function request<T>(path: string, requestOptions: FetchOptions = {}): Promise<T> {
    const mergedOptions: FetchOptions = { ...defaultFetchOptions, ...requestOptions };
    mergedOptions.headers = mergeHeaders(defaultFetchOptions?.headers, requestOptions.headers);

    const res = await fetcher(`${baseUrl}${path}`, mergedOptions);
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const text = await res.text();
        if (text) {
          const body = JSON.parse(text) as { message?: string; error?: string };
          if (body?.message) {
            message = body.message;
          } else if (body?.error) {
            message = body.error;
          }
        }
      } catch {
        // Failed to parse error response body, will use default message
      }
      throw new Error(message);
    }
    if (res.status === 204 || res.status === 205) {
      return undefined as T;
    }
    const text = await res.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  async function fetchWithAuth<T>(path: string, accessToken?: string): Promise<T[]> {
    const response = await request<T[] | null>(path, {
      headers: buildHeaders(accessToken),
    });
    return response ?? [];
  }

  async function mutateWithAuth(
    path: string,
    method: 'POST' | 'DELETE',
    accessToken: string,
  ): Promise<void> {
    await request<void>(path, {
      method,
      headers: buildHeaders(accessToken),
    });
  }

  async function fetchStoreReviews(storeId: string, sort: ReviewSort, accessToken?: string) {
    const query = new URLSearchParams();
    if (sort) {
      query.set('sort', sort);
    }
    const q = query.toString();
    return fetchWithAuth<ApiReview>(
      `/stores/${encodePathSegment(storeId)}/reviews${q ? `?${q}` : ''}`,
      accessToken,
    );
  }

  async function fetchStores() {
    return fetchWithAuth<ApiStore>('/stores');
  }

  async function fetchStations() {
    return request<ApiStation[]>('/stations');
  }

  async function fetchStoreById(storeId: string) {
    return request<ApiStore>(`/stores/${encodePathSegment(storeId)}`, {
      headers: buildHeaders(),
    });
  }

  async function fetchStoreMenus(storeId: string) {
    return fetchWithAuth<ApiMenu>(`/stores/${encodePathSegment(storeId)}/menus`);
  }

  async function fetchUserReviews(userId: string, accessToken?: string) {
    return fetchWithAuth<ApiReview>(`/users/${encodePathSegment(userId)}/reviews`, accessToken);
  }

  async function fetchUserFavorites(accessToken: string) {
    return fetchWithAuth<ApiFavorite>('/users/me/favorites', accessToken);
  }

  async function addFavorite(storeId: string, accessToken: string) {
    return request<ApiFavorite>('/users/me/favorites', {
      method: 'POST',
      headers: buildHeaders(accessToken, undefined, true),
      body: JSON.stringify({ store_id: storeId }),
    });
  }

  async function removeFavorite(storeId: string, accessToken: string) {
    return mutateWithAuth(
      `/users/me/favorites/${encodePathSegment(storeId)}`,
      'DELETE',
      accessToken,
    );
  }

  async function fetchAuthMe(accessToken: string) {
    return request<ApiUser>('/auth/me', {
      headers: buildHeaders(accessToken),
    });
  }

  async function createReview(
    storeId: string,
    input: {
      rating: number;
      rating_details?: ApiRatingDetails | null;
      content?: string | null;
      file_ids?: string[];
      menu_ids?: string[];
    },
    accessToken: string,
  ) {
    return request<ApiReview>(`/stores/${encodePathSegment(storeId)}/reviews`, {
      method: 'POST',
      headers: buildHeaders(accessToken, undefined, true),
      body: JSON.stringify({
        rating: input.rating,
        rating_details: input.rating_details ?? null,
        content: input.content ?? null,
        file_ids: input.file_ids ?? [],
        menu_ids: input.menu_ids ?? [],
      }),
    });
  }

  async function createReviewUploads(
    storeId: string,
    files: UploadFileInput[],
    accessToken: string,
  ) {
    const payload = {
      store_id: storeId,
      files,
    };
    return request<UploadResponse>('/media/upload', {
      method: 'POST',
      headers: buildHeaders(accessToken, undefined, true),
      body: JSON.stringify(payload),
    });
  }

  async function likeReview(reviewId: string, accessToken: string) {
    return mutateWithAuth(`/reviews/${encodePathSegment(reviewId)}/likes`, 'POST', accessToken);
  }

  async function unlikeReview(reviewId: string, accessToken: string) {
    return mutateWithAuth(`/reviews/${encodePathSegment(reviewId)}/likes`, 'DELETE', accessToken);
  }

  return {
    fetchStoreReviews,
    fetchStores,
    fetchStations,
    fetchStoreById,
    fetchStoreMenus,
    fetchUserReviews,
    fetchUserFavorites,
    addFavorite,
    removeFavorite,
    fetchAuthMe,
    createReview,
    createReviewUploads,
    likeReview,
    unlikeReview,
  };
}

export type ConfiguredApiClientOptions = {
  baseUrl?: string;
  defaultFetchOptions?: FetchOptions;
};

export function createConfiguredApiClient(options: ConfiguredApiClientOptions) {
  const finalBaseUrl = normalizeBaseUrl(options.baseUrl || DEFAULT_API_BASE_URL);
  return createApiClient({
    baseUrl: finalBaseUrl,
    defaultFetchOptions: options.defaultFetchOptions,
  });
}

// =============================================================================
// Storage URL Utilities
// =============================================================================

export type StorageUrlOptions = {
  supabaseUrl: string;
  bucket?: string;
};

const DEFAULT_STORAGE_BUCKET = 'media';

/**
 * Supabase Storage の公開URLを生成する
 * @param objectKey ストレージ内のオブジェクトキー
 * @param options SupabaseのURLとバケット名
 * @returns 公開URL（objectKeyが空の場合は空文字列）
 */
export function buildStorageUrl(objectKey: string, options: StorageUrlOptions): string {
  if (!options.supabaseUrl || !objectKey) return '';
  const bucket = options.bucket ?? DEFAULT_STORAGE_BUCKET;
  return `${options.supabaseUrl}/storage/v1/object/public/${bucket}/${objectKey}`;
}

// =============================================================================
// Platform-Configured Storage
// =============================================================================

export type PlatformStorageConfig = {
  supabaseUrl: string;
  storageBucket?: string;
};

export type ConfiguredStorageExports = {
  SUPABASE_STORAGE_BUCKET: string;
  buildStorageUrl: (objectKey: string) => string;
};

/**
 * Creates platform-configured storage utilities.
 * Apps should call this with their environment-specific configuration.
 */
export function createConfiguredStorage(config: PlatformStorageConfig): ConfiguredStorageExports {
  const bucket = config.storageBucket ?? DEFAULT_STORAGE_BUCKET;
  return {
    SUPABASE_STORAGE_BUCKET: bucket,
    buildStorageUrl: (objectKey: string) =>
      buildStorageUrl(objectKey, {
        supabaseUrl: config.supabaseUrl,
        bucket,
      }),
  };
}

// =============================================================================
// Platform-Configured API Client
// =============================================================================

export type PlatformApiConfig = {
  baseUrl?: string;
  defaultFetchOptions?: FetchOptions;
};

/**
 * API function names that createConfiguredApiClient returns.
 * Use this for re-exporting in app-specific modules.
 */
export const API_FUNCTION_NAMES = [
  'fetchStoreReviews',
  'fetchStores',
  'fetchStations',
  'fetchStoreById',
  'fetchStoreMenus',
  'fetchUserReviews',
  'fetchUserFavorites',
  'addFavorite',
  'removeFavorite',
  'fetchAuthMe',
  'createReview',
  'createReviewUploads',
  'likeReview',
  'unlikeReview',
] as const;

export type ApiExports = ReturnType<typeof createConfiguredApiClient>;
