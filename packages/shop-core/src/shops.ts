export type ShopCategory =
  | 'レストラン'
  | 'カフェ・喫茶'
  | 'ベーカリー・パン'
  | 'スイーツ・デザート専門'
  | 'ファストフード・テイクアウト'
  | 'バー・居酒屋'
  | 'ビュッフェ・食べ放題';

export const MENU_TAB_MAP: Record<ShopCategory, string[]> = {
  レストラン: ['ランチ', 'ディナー', 'ドリンク', 'デザート'],
  'カフェ・喫茶': ['ドリンク', 'フード', 'スイーツ'],
  'ベーカリー・パン': ['惣菜パン', '菓子パン', 'ドリンク'],
  'スイーツ・デザート専門': ['ジェラート', '焼き菓子', 'ドリンク'],
  'ファストフード・テイクアウト': ['メイン', 'サイド', 'ドリンク'],
  'バー・居酒屋': ['おつまみ', 'メイン', 'お酒'],
  'ビュッフェ・食べ放題': ['料理', 'デザート', 'ドリンク'],
};

export interface Shop {
  id: string;
  name: string;
  category: ShopCategory;
  distanceMinutes: number;
  rating: number;
  budget: '$' | '$$' | '$$$';
  createdAt: string; // アプリに追加した日
  openedAt: string; // 実際のオープン日
  description: string;
  placeId: string;
  imageUrl: string;
  imageUrls?: string[]; // 複数画像対応
  tags: string[];
  menu?: {
    id: string;
    name: string;
    category: string;
    price: string;
  }[];
}

// NOTE: This is a shared placeholder Google Place ID used for demo/development data.
// In production, each shop should have its own unique and correct Google Place ID.
const DEFAULT_PLACE_ID = 'ChIJRUjlH92OAGAR6otTD3tUcrg';

export const SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'モーニング ブリュー カフェ',
    category: 'カフェ・喫茶',
    distanceMinutes: 5,
    rating: 4.6,
    budget: '$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2024-10-12T00:00:00.000Z',
    description: '一杯ずつハンドドリップで淹れるコーヒーと、静かな時間を楽しめる朝カフェ。',
    imageUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2020-08-14T00:00:00.000Z',
    description: '旬の魚を使ったおまかせコースが人気のカウンター寿司。',
    imageUrl:
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2023-09-05T00:00:00.000Z',
    description: '旬のフルーツを使ったジェラートと焼き菓子の専門店。',
    imageUrl:
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2019-11-30T00:00:00.000Z',
    description: '自然派ワインと季節の小皿料理、レコードの音色が心地よい隠れ家バー。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2024-02-18T00:00:00.000Z',
    description: '旬の野菜を使ったボウルとスープが揃うヘルシーランチスポット。',
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2025-01-22T00:00:00.000Z',
    description: '焼きたてのクロワッサンとサワードウが並ぶ人気ベーカリー。',
    imageUrl:
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2023-12-01T00:00:00.000Z',
    description: '旬野菜とスパイス料理をビュッフェ形式で楽しめるヘルシーダイニング。',
    imageUrl:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2021-07-14T00:00:00.000Z',
    description: '懐かしのゲーム機とクラフトドリンクを気軽にできるナイトスポット。',
    imageUrl:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2021-12-06T00:00:00.000Z',
    description: '海の幸をつかったグリル料理と景色が素晴らしいダイニング。',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2024-07-30T00:00:00.000Z',
    description: '生演奏のジャズと季節のカクテルを楽しめる大人の社交場。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
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
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2023-02-14T00:00:00.000Z',
    description: 'サラダボウルとコールドプレスジュースが並ぶデリスタンド。',
    imageUrl:
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['デリ', 'テイクアウト', 'ヘルシー'],
    menu: [
      { id: 'm-14-1', name: 'サーモンPokeボウル', category: 'メイン', price: '¥1,580' },
      { id: 'm-14-2', name: 'オレンジジュース', category: 'ドリンク', price: '¥680' },
    ],
  },
];

export const CATEGORIES: ShopCategory[] = Array.from(new Set(SHOPS.map(shop => shop.category)));
