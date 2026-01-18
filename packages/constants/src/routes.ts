export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  TABS: '/(tabs)',
  TABS_FAVORITES: '/(tabs)/favorites',
  MYPAGE: '/mypage',
  FAVORITES: '/favorites',
  SEARCH: '/search',
  MENU: '/menu',
  SHOP_DETAIL: (id: string) => `/shop/${id}` as const,
  REVIEW: (shopId: string) => `/shop/${shopId}/review` as const,
  REVIEW_HISTORY: '/reviews',
  OWNER: '/owner',
  OWNER_LOGIN: '/owner/login',
  OWNER_SIGNUP: '/owner/signup',
  OWNER_REGISTER_SHOP: '/owner/register-shop',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_REGISTER: '/profile/register',
  AUTH_CALLBACK: '/auth/callback',
  CALLBACK: '/callback',
} as const;

export function buildGoogleMapsUrl(placeId: string, shopName?: string): string {
  const baseUrl = 'https://www.google.com/maps/search/';
  const params = new URLSearchParams({
    api: '1',
    query_place_id: placeId,
  });
  if (shopName) {
    params.set('query', shopName);
  }
  return `${baseUrl}?${params.toString()}`;
}
