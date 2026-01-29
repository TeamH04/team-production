import type { Shop } from '@team/types';

export const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

/** デモデータの基準日 */
export const DEMO_BASE_DATE = '2025-02-01';

/** Unsplash画像URLの共通クエリパラメータ */
const IMAGE_QUERY_PARAMS = '?auto=format&fit=crop&w=600&q=80';

/** デモ用Unsplash画像URLプール */
export const IMAGE_POOL = [
  `https://images.unsplash.com/photo-1509042239860-f550ce710b93${IMAGE_QUERY_PARAMS}`, // コーヒー
  `https://images.unsplash.com/photo-1495521821757-a1efb6729352${IMAGE_QUERY_PARAMS}`, // カフェ
  `https://images.unsplash.com/photo-1553621042-f6e147245754${IMAGE_QUERY_PARAMS}`, // 寿司
  `https://images.unsplash.com/photo-1546069901-ba9599a7e63c${IMAGE_QUERY_PARAMS}`, // サラダ
  `https://images.unsplash.com/photo-1505253758473-96b7015fcd40${IMAGE_QUERY_PARAMS}`, // ジェラート
  `https://images.unsplash.com/photo-1504674900247-0877df9cc836${IMAGE_QUERY_PARAMS}`, // 料理
  `https://images.unsplash.com/photo-1470337458703-46ad1756a187${IMAGE_QUERY_PARAMS}`, // バー/ワイン
  `https://images.unsplash.com/photo-1525755662778-989d0524087e${IMAGE_QUERY_PARAMS}`, // ヘルシー料理
  `https://images.unsplash.com/photo-1512621776951-a57141f2eefd${IMAGE_QUERY_PARAMS}`, // 野菜
  `https://images.unsplash.com/photo-1544984243-ec57ea16fe25${IMAGE_QUERY_PARAMS}`, // パン
  `https://images.unsplash.com/photo-1540189549336-e6e99c3679fe${IMAGE_QUERY_PARAMS}`, // ビュッフェ
  `https://images.unsplash.com/photo-1545239351-1141bd82e8a6${IMAGE_QUERY_PARAMS}`, // アーケード
  `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4${IMAGE_QUERY_PARAMS}`, // レストラン
  `https://images.unsplash.com/photo-1559827260-dc66d52bef19${IMAGE_QUERY_PARAMS}`, // シーフード
  `https://images.unsplash.com/photo-1504754524776-8f4f37790ca0${IMAGE_QUERY_PARAMS}`, // デリ
  `https://images.unsplash.com/photo-1568901346375-23c9450c58cd${IMAGE_QUERY_PARAMS}`, // ボウル
] as const;

/** 評価の最小値 */
export const RATING_MIN = 3.5;

/** 評価の最大値 */
export const RATING_MAX = 5.0;
