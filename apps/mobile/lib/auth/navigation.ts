import { createNavigateAfterLogin } from '@team/hooks';
import { useRouter } from 'expo-router';

/**
 * ログイン成功後のナビゲーションフック
 * isOwner フラグに基づいて適切なルートにリダイレクト
 */
export const useNavigateAfterLogin = createNavigateAfterLogin(useRouter);
