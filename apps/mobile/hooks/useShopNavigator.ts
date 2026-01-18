import { ROUTES } from '@team/constants';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useShopNavigator() {
  const router = useRouter();

  const navigateToShop = useCallback(
    (shopId: string) => {
      router.push(ROUTES.SHOP_DETAIL(shopId));
    },
    [router],
  );

  return { navigateToShop };
}
