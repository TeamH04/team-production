import type { ApiStore } from '@team/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api').replace(
  /\/$/,
  '',
);

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
