import { MENU_TAB_MAP, type Shop, type ShopCategory } from '@team/types';

import { DEMO_BASE_DATE, IMAGE_POOL, RATING_MAX, RATING_MIN } from './constants';

/** デモデータの基準日時（ISO 8601 形式） */
const DEMO_BASE_DATE_ISO = `${DEMO_BASE_DATE}T00:00:00.000Z`;

export { MENU_TAB_MAP, type Shop, type ShopCategory };

/**
 * ベースとなる店舗データから派生店舗を生成するための設定。
 * - `key`: 派生店舗のIDや画像シグネチャに付与する一意な接尾辞。
 * - `label`: 店舗名に追加するラベル（例: 東口店）。
 * - `distanceDelta`: ベース店舗の所要時間に加算・減算する分数。生成時に奇数番目の派生には +1 分がさらに足され、距離分布をばらけさせる。
 * - `ratingDelta`: ベース店舗の評価に加算・減算する値。生成時に 3.5〜5.0 の範囲にクランプされる。
 * - `createdOffsetDays`: `createdAt` を何日ずらすかを示す日数。生成順のオフセットと合算し、追加日時の重複を避ける。
 */
type ShopVariant = {
  key: string;
  label: string;
  distanceDelta: number;
  ratingDelta: number;
  createdOffsetDays: number;
};

// 注意：これはデモ・開発用データとして共有されているプレースホルダー用のGoogle Place ID。
// 本番環境では、各店舗ごとに固有の正しいGoogle Place IDを設定する必要がある。
const DEFAULT_PLACE_ID = 'ChIJRUjlH92OAGAR6otTD3tUcrg';

/**
 * ISO 文字列の日付を指定日数だけ前後にずらし、ISO 文字列で返す。
 * @param isoDate 基準となる日付（ISO 8601 文字列）
 * @param offsetDays 基準日付からの加減日数（負数も可）
 * @returns オフセット後の日付（ISO 8601 文字列）
 */
const shiftDate = (isoDate: string, offsetDays: number) => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

/**
 * 評価値を 3.5〜5.0 の範囲に丸め、1 桁小数に整形する。
 * @param rating 元の評価値
 * @returns 許容範囲に収めた評価値
 */
const clampRating = (rating: number) =>
  Number(Math.min(RATING_MAX, Math.max(RATING_MIN, rating)).toFixed(1));

/**
 * 距離（分）をオフセットし、最低 1 分を保証する。
 * @param distance 基準の距離（分）
 * @param delta 加減する距離（分）
 * @returns オフセット後の距離（1 以上）
 */
const adjustDistance = (distance: number, delta: number) => Math.max(1, distance + delta);

/**
 * ベース店舗とバリアント設定、生成順オフセットから派生店舗を生成する。
 * - `id` と `menu` の ID にバリアントキーを付与し一意化する。
 * - 店舗名にバリアントラベルを付与する。
 * - 距離はバリアントの `distanceDelta` と、奇数オフセット時の +1 を加えたうえで 1 分以上に補正する。
 * - 評価は `ratingDelta` を適用後、3.5〜5.0 にクランプする。
 * - `createdAt` と `openedAt` は `createdOffsetDays` と生成順 `offset` を合算してずらす。
 * - 画像 URL には `sig` パラメータを付与してバリアントごとに一意化する。
 * - `placeId` はデモ/開発用の共有プレースホルダーをそのまま利用する（実運用では各店舗固有の ID を設定）。
 * @param shop ベースとなる店舗データ
 * @param variant バリアント設定（距離・評価・日付の変化量など）
 * @param offset 生成順を示すオフセット（`variantIndex + baseIndex` を渡し、距離・日付の被りを避けるために使用）
 * @returns 派生後の店舗データ
 */
const createVariantShop = (shop: Shop, variant: ShopVariant, offset: number): Shop => {
  // NOTE: `sig` は外部の画像サービス（例: Unsplash）では解釈されませんが、
  // デモデータでバリアントごとの URL を一意にしてキャッシュバスティング・識別を行うために付与しています。
  // `imageUrls` が未定義でも `imageUrl` を含む配列に正規化してから付与するため、
  // 常に `sig` 付きの URL が利用され、フォールバック条件は不要になります。
  const baseImageUrls = shop.imageUrls ?? [shop.imageUrl];
  const imageUrls = baseImageUrls.map((url, index) => `${url}&sig=${variant.key}-${index}`);

  return {
    ...shop,
    id: `${shop.id}-${variant.key}`,
    name: `${shop.name} ${variant.label}`,
    // 奇数オフセットだけ +1 することで、距離が完全に重ならないようにわずかにばらけさせ、
    // バリアント生成時にリスト表示の並び方を変えやすくしている。
    distanceMinutes: adjustDistance(
      shop.distanceMinutes,
      variant.distanceDelta + (offset % 2 === 0 ? 0 : 1),
    ),
    rating: clampRating(shop.rating + variant.ratingDelta),
    createdAt: shiftDate(shop.createdAt, variant.createdOffsetDays + offset),
    openedAt: shiftDate(shop.openedAt, variant.createdOffsetDays + offset),
    imageUrl: imageUrls[0],
    imageUrls,
    menu: shop.menu?.map(menu => ({ ...menu, id: `${menu.id}-${variant.key}` })),
  };
};

const BASE_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'モーニング ブリュー カフェ',
    category: 'カフェ・喫茶',
    distanceMinutes: 5,
    rating: 4.6,
    budget: '$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2024-10-12T00:00:00.000Z',
    description: '一杯ずつハンドドリップで淹れるコーヒーと、静かな時間を楽しめる朝カフェ。',
    address: '東京都渋谷区神南1-2-3',
    imageUrl: IMAGE_POOL[0], // コーヒー
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[0], IMAGE_POOL[1], IMAGE_POOL[0]], // コーヒー, カフェ, コーヒー
    tags: ['コーヒー', '静かな空間', 'Wi-Fi'],
    menu: [
      { id: 'm-1-1', name: 'ハンドドリップ コーヒー', category: 'ドリンク', price: '¥550' },
      { id: 'm-1-2', name: 'カフェラテ', category: 'ドリンク', price: '¥620' },
      { id: 'm-1-3', name: 'シナモンロール', category: 'スイーツ', price: '¥480' },
    ],
  },
  {
    id: 'shop-2',
    name: '夕焼け寿司割烹',
    category: 'レストラン',
    distanceMinutes: 11,
    rating: 4.8,
    budget: '$$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2020-08-14T00:00:00.000Z',
    description: '旬の魚を使ったおまかせコースが人気のカウンター寿司。',
    address: '東京都中央区銀座3-4-5',
    imageUrl: IMAGE_POOL[2], // 寿司
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[2], IMAGE_POOL[2], IMAGE_POOL[3]], // 寿司, 寿司, サラダ
    tags: ['寿司', 'カウンター', '記念日'],
    menu: [
      { id: 'm-2-1', name: '特選おまかせコース', category: 'ディナー', price: '¥18,000' },
      { id: 'm-2-2', name: '白身三昧ランチ', category: 'ランチ', price: '¥3,500' },
      { id: 'm-2-3', name: '穴子一本握り', category: 'ランチ', price: '¥1,200' },
    ],
  },
  {
    id: 'shop-3',
    name: 'グロウ ジェラート ラボ',
    category: 'スイーツ・デザート専門',
    distanceMinutes: 7,
    rating: 4.7,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2023-09-05T00:00:00.000Z',
    description: '旬のフルーツを使ったジェラートと焼き菓子の専門店。',
    address: '東京都台東区浅草2-10-4',
    imageUrl: IMAGE_POOL[4], // ジェラート
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[4], IMAGE_POOL[5], IMAGE_POOL[5]], // ジェラート, 料理, 料理
    tags: ['ジェラート', '季節限定', 'イートイン'],
    menu: [
      { id: 'm-3-1', name: 'ピスタチオ ジェラート', category: 'ジェラート', price: '¥750' },
      { id: 'm-3-2', name: '塩キャラメル クッキーサンド', category: '焼き菓子', price: '¥580' },
      { id: 'm-3-3', name: '季節のフルーツパフェ', category: 'ジェラート', price: '¥1,650' },
    ],
  },
  {
    id: 'shop-4',
    name: 'ルーメン ワインバー',
    category: 'バー・居酒屋',
    distanceMinutes: 9,
    rating: 4.7,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2019-11-30T00:00:00.000Z',
    description: '自然派ワインと季節の小皿料理、レコードの音色が心地よい隠れ家バー。',
    address: '東京都世田谷区三軒茶屋1-8-2',
    imageUrl: IMAGE_POOL[6], // バー/ワイン
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[6], IMAGE_POOL[6], IMAGE_POOL[6]], // バー/ワイン x3
    tags: ['ワイン', '大人の雰囲気', '音楽'],
    menu: [
      { id: 'm-4-1', name: 'グラスワイン', category: 'お酒', price: '¥1,100' },
      { id: 'm-4-2', name: '生ハム盛り合わせ', category: 'おつまみ', price: '¥1,600' },
    ],
  },
  {
    id: 'shop-5',
    name: 'アーバングリーンズ キッチン',
    category: 'レストラン',
    distanceMinutes: 6,
    rating: 4.4,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2024-02-18T00:00:00.000Z',
    description: '旬の野菜を使ったボウルとスープが揃うヘルシーランチスポット。',
    address: '東京都港区南青山5-12-1',
    imageUrl: IMAGE_POOL[7], // ヘルシー料理
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[7], IMAGE_POOL[3], IMAGE_POOL[8]], // ヘルシー料理, サラダ, 野菜
    tags: ['ヘルシー', 'テイクアウト', 'ランチ'],
    menu: [
      { id: 'm-5-1', name: 'ヴィーガンサラダセット', category: 'ランチ', price: '¥1,450' },
      { id: 'm-5-2', name: 'デトックススープ', category: 'ランチ', price: '¥980' },
    ],
  },
  {
    id: 'shop-6',
    name: 'ベイカーズ レーン',
    category: 'ベーカリー・パン',
    distanceMinutes: 4,
    rating: 4.6,
    budget: '$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2025-01-22T00:00:00.000Z',
    description: '焼きたてのクロワッサンとサワードウが並ぶ人気ベーカリー。',
    address: '東京都目黒区自由が丘2-5-8',
    imageUrl: IMAGE_POOL[9], // パン
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[9], IMAGE_POOL[0], IMAGE_POOL[0]], // パン, コーヒー, コーヒー
    tags: ['パン', 'モーニング', 'テラス席'],
    menu: [
      { id: 'm-6-1', name: '明太フランス', category: '惣菜パン', price: '¥320' },
      { id: 'm-6-2', name: '焼きたてクロワッサン', category: '菓子パン', price: '¥280' },
      { id: 'm-6-3', name: 'アイスコーヒー', category: 'ドリンク', price: '¥450' },
    ],
  },
  {
    id: 'shop-8',
    name: 'ロータス ベジビュッフェ',
    category: 'ビュッフェ・食べ放題',
    distanceMinutes: 12,
    rating: 4.6,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2023-12-01T00:00:00.000Z',
    description: '旬野菜とスパイス料理をビュッフェ形式で楽しめるヘルシーダイニング。',
    address: '東京都渋谷区代々木3-9-6',
    imageUrl: IMAGE_POOL[10], // ビュッフェ
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[10], IMAGE_POOL[5], IMAGE_POOL[5]], // ビュッフェ, 料理, 料理
    tags: ['ビュッフェ', '野菜たっぷり', 'スパイス'],
    menu: [
      { id: 'm-8-1', name: 'ランチ食べ放題', category: '料理', price: '¥2,800' },
      { id: 'm-8-2', name: '豆腐のヘルシープリン', category: 'デザート', price: '¥450' },
    ],
  },
  {
    id: 'shop-10',
    name: 'レトロ アーケード ロフト',
    category: 'バー・居酒屋',
    distanceMinutes: 13,
    rating: 4.4,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2021-07-14T00:00:00.000Z',
    description: '懐かしのゲーム機とクラフトドリンクを気軽にできるナイトスポット。',
    address: '東京都豊島区池袋1-11-4',
    imageUrl: IMAGE_POOL[11], // アーケード
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[11], IMAGE_POOL[11], IMAGE_POOL[11]], // アーケード x3
    tags: ['ゲーム', 'グループ', '夜遊び'],
    menu: [
      { id: 'm-10-1', name: '自家製ナチョス', category: 'おつまみ', price: '¥850' },
      { id: 'm-10-2', name: 'レトロソーダカクテル', category: 'お酒', price: '¥750' },
    ],
  },
  {
    id: 'shop-11',
    name: 'ハーバー シーフード グリル',
    category: 'レストラン',
    distanceMinutes: 14,
    rating: 4.7,
    budget: '$$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2021-12-06T00:00:00.000Z',
    description: '海の幸をつかったグリル料理と景色が素晴らしいダイニング。',
    address: '東京都港区台場2-7-1',
    imageUrl: IMAGE_POOL[12], // レストラン
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[12], IMAGE_POOL[13], IMAGE_POOL[12]], // レストラン, シーフード, レストラン
    tags: ['シーフード', 'ディナー', '予約制'],
    menu: [
      { id: 'm-11-1', name: '本日のお魚グリル', category: 'ディナー', price: '¥4,200' },
      { id: 'm-11-2', name: '白ワイン グラス', category: 'ドリンク', price: '¥950' },
    ],
  },
  {
    id: 'shop-12',
    name: 'リバーサイド ジャズクラブ',
    category: 'バー・居酒屋',
    distanceMinutes: 13,
    rating: 4.7,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2024-07-30T00:00:00.000Z',
    description: '生演奏のジャズと季節のカクテルを楽しめる大人の社交場。',
    address: '東京都新宿区神楽坂4-6-9',
    imageUrl: IMAGE_POOL[6], // バー/ワイン
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[6], IMAGE_POOL[6], IMAGE_POOL[6]], // バー/ワイン x3
    tags: ['ジャズ', 'ライブ', '夜景'],
    menu: [
      { id: 'm-12-1', name: 'クラフトジントニック', category: 'お酒', price: '¥1,350' },
      { id: 'm-12-2', name: 'ミックスナッツ燻製', category: 'おつまみ', price: '¥650' },
    ],
  },
  {
    id: 'shop-14',
    name: 'フレッシュ ボウル マーケット',
    category: 'ファストフード・テイクアウト',
    distanceMinutes: 6,
    rating: 4.3,
    budget: '$$',
    createdAt: DEMO_BASE_DATE_ISO,
    openedAt: '2023-02-14T00:00:00.000Z',
    description: 'サラダボウルとコールドプレスジュースが並ぶデリスタンド。',
    address: '東京都千代田区丸の内1-4-2',
    imageUrl: IMAGE_POOL[14], // デリ
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [IMAGE_POOL[14], IMAGE_POOL[15], IMAGE_POOL[3]], // デリ, ボウル, サラダ
    tags: ['デリ', 'テイクアウト', 'ヘルシー'],
    menu: [
      { id: 'm-14-1', name: 'サーモンPokeボウル', category: 'メイン', price: '¥1,580' },
      { id: 'm-14-2', name: 'オレンジジュース', category: 'ドリンク', price: '¥680' },
    ],
  },
];

// NOTE: デモ/開発用のダミー分岐設定。本番でのデータシードには使用しない。
const VARIANTS: ShopVariant[] = [
  { key: 'east', label: '東口店', distanceDelta: 1, ratingDelta: -0.1, createdOffsetDays: 5 },
  { key: 'west', label: '西通り店', distanceDelta: 2, ratingDelta: 0.05, createdOffsetDays: 10 },
  { key: 'north', label: '北側店', distanceDelta: 3, ratingDelta: 0, createdOffsetDays: 15 },
  { key: 'south', label: '南広場店', distanceDelta: -1, ratingDelta: -0.05, createdOffsetDays: 20 },
];

// NOTE: デモ用の派生店舗データ。本番では固有のデータソースを利用する。
// offset には `variantIndex + baseIndex` を渡し、
// 同じバリアントでも店舗ごとに距離・日付の微調整量がずれるようにして
// 完全に同一の値が並ばないよう分散させている（デモデータの見栄え用）。
const VARIANT_SHOPS = VARIANTS.flatMap((variant, variantIndex) =>
  BASE_SHOPS.map((shop, baseIndex) => createVariantShop(shop, variant, variantIndex + baseIndex)),
);

export const SHOPS: Shop[] = [...BASE_SHOPS, ...VARIANT_SHOPS];

export const CATEGORIES: ShopCategory[] = Array.from(new Set(SHOPS.map(shop => shop.category)));
