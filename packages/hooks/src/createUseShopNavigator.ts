import { ROUTES } from '@team/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouterLike = { push: (...args: any[]) => any };

export type UseShopNavigatorResult = {
  navigateToShop: (shopId: string) => void;
};

/**
 * プラットフォーム固有のルーターを抽象化した店舗ナビゲーションフック生成関数
 * @param useRouterHook - プラットフォーム固有の useRouter フック
 * @returns useShopNavigator フック
 */
export function createUseShopNavigator(
  useRouterHook: () => RouterLike,
): () => UseShopNavigatorResult {
  return function useShopNavigator(): UseShopNavigatorResult {
    const router = useRouterHook();
    return {
      navigateToShop: (shopId: string) => {
        router.push(ROUTES.SHOP_DETAIL(shopId));
      },
    };
  };
}
