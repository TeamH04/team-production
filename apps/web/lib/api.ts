const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api').replace(
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
  category: string;
  budget: string;
  average_rating: number;
  distance_minutes: number;
  created_at: string;
  opened_at?: string | null;
  description?: string | null;
  address: string;
  place_id: string;
  image_urls: string[];
  tags: string[];
  menus?: ApiMenu[];
};

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchStores(): Promise<ApiStore[]> {
  const stores = await request<ApiStore[] | null>('/stores');
  return stores ?? [];
}

export async function fetchStoreById(id: string): Promise<ApiStore> {
  return request<ApiStore>(`/stores/${encodeURIComponent(id)}`);
}
