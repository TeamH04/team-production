const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api').replace(
  /\/$/,
  ''
);

export type ApiFile = {
  file_id: string;
  file_name: string;
  object_key: string;
  url?: string | null;
  content_type?: string | null;
};

export type ApiUser = {
  user_id: string;
  name: string;
  email: string;
  icon_file_id?: string | null;
  icon_url?: string | null;
  provider: string;
  gender?: string | null;
  birthday?: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type ApiMenu = {
  menu_id: string;
  name: string;
  price?: number | null;
  description?: string | null;
  category?: string | null;
};

export type ApiStore = {
  store_id: string;
  thumbnail_file_id?: string | null;
  thumbnail_file?: ApiFile | null;
  name: string;
  opened_at?: string | null;
  description?: string | null;
  address: string;
  place_id: string;
  opening_hours?: string | null;
  latitude: number;
  longitude: number;
  google_map_url?: string | null;
  is_approved: boolean;
  category: string;
  budget: string;
  average_rating: number;
  distance_minutes: number;
  tags: string[];
  image_urls: string[];
  created_at: string;
  updated_at: string;
  menus?: ApiMenu[];
};

export type ApiReview = {
  review_id: string;
  store_id: string;
  user_id: string;
  rating: number;
  content?: string | null;
  created_at: string;
  likes_count?: number;
  liked_by_me?: boolean;
  menus?: ApiMenu[];
  menu_ids?: string[];
  files?: ApiFile[];
};

export type ReviewSort = 'new' | 'liked';

export type UploadFileInput = {
  file_name: string;
  file_size?: number;
  content_type: string;
};

export type SignedUploadFile = {
  file_id: string;
  object_key: string;
  path: string;
  token: string;
  content_type: string;
};

type UploadResponse = {
  files: SignedUploadFile[];
};

type ReviewsResponse = ApiReview[];
type StoresResponse = ApiStore[];

type FetchOptions = Parameters<typeof fetch>[1];
type HeaderInit = NonNullable<FetchOptions>['headers'];

function buildHeaders(accessToken?: string, extra?: HeaderInit): HeaderInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(extra)) {
      extra.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.entries(extra).forEach(([key, value]) => {
        headers[key] = value;
      });
    }
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
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
      // noop
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

export async function fetchStoreReviews(storeId: string, sort: ReviewSort, accessToken?: string) {
  const query = new URLSearchParams();
  if (sort) {
    query.set('sort', sort);
  }
  const q = query.toString();
  const reviews = await request<ReviewsResponse | null>(
    `/stores/${storeId}/reviews${q ? `?${q}` : ''}`,
    {
      headers: buildHeaders(accessToken),
    }
  );
  return reviews ?? [];
}

export async function fetchStores() {
  const stores = await request<StoresResponse | null>('/stores', {
    headers: buildHeaders(),
  });
  return stores ?? [];
}

export async function fetchStoreById(storeId: string) {
  return request<ApiStore>(`/stores/${storeId}`, {
    headers: buildHeaders(),
  });
}

export async function fetchStoreMenus(storeId: string) {
  const menus = await request<ApiMenu[] | null>(`/stores/${storeId}/menus`, {
    headers: buildHeaders(),
  });
  return menus ?? [];
}

export async function fetchUserReviews(userId: string, accessToken?: string) {
  const reviews = await request<ReviewsResponse | null>(`/users/${userId}/reviews`, {
    headers: buildHeaders(accessToken),
  });
  return reviews ?? [];
}

export async function fetchAuthMe(accessToken: string) {
  return request<ApiUser>('/auth/me', {
    headers: buildHeaders(accessToken),
  });
}

export async function createReview(
  storeId: string,
  input: { rating: number; content?: string | null; file_ids?: string[]; menu_ids?: string[] },
  accessToken: string
) {
  return request<ApiReview>(`/stores/${storeId}/reviews`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      rating: input.rating,
      content: input.content ?? null,
      file_ids: input.file_ids ?? [],
      menu_ids: input.menu_ids ?? [],
    }),
  });
}

export async function createReviewUploads(
  storeId: string,
  files: UploadFileInput[],
  accessToken: string
) {
  const payload = {
    store_id: storeId,
    files,
  };
  return request<UploadResponse>('/media/upload', {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}

export async function likeReview(reviewId: string, accessToken: string) {
  await request<void>(`/reviews/${reviewId}/likes`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
  });
}

export async function unlikeReview(reviewId: string, accessToken: string) {
  await request<void>(`/reviews/${reviewId}/likes`, {
    method: 'DELETE',
    headers: buildHeaders(accessToken),
  });
}
