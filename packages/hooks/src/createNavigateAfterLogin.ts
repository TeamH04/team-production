import { ROUTES } from '@team/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NavigateAfterLoginRouter = { replace: (...args: any[]) => any };

export type UseNavigateAfterLoginResult = {
  navigateAfterLogin: (isOwner: boolean) => void;
};

/**
 * プラットフォーム固有のルーターを抽象化したログイン後ナビゲーションフック生成関数
 * @param useRouterHook - プラットフォーム固有の useRouter フック
 * @returns useNavigateAfterLogin フック
 */
export function createNavigateAfterLogin(
  useRouterHook: () => NavigateAfterLoginRouter,
): () => UseNavigateAfterLoginResult {
  return function useNavigateAfterLogin(): UseNavigateAfterLoginResult {
    const router = useRouterHook();
    return {
      navigateAfterLogin: (isOwner: boolean) => {
        if (isOwner) {
          router.replace(ROUTES.OWNER);
        } else {
          router.replace(ROUTES.TABS);
        }
      },
    };
  };
}
