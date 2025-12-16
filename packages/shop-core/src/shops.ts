export type ShopCategory =
  | 'カフェ'
  | 'レストラン'
  | 'バー'
  | 'ベーカリー'
  | 'サロン'
  | 'ジム'
  | '書店'
  | 'ライフスタイル'
  | 'エンタメ'
  | 'ワークスペース';

export interface Shop {
  id: string;
  name: string;
  category: ShopCategory;
  distanceMinutes: number;
  rating: number;
  budget: '$' | '$$' | '$$$';
  description: string;
  imageUrl: string;
  imageUrls?: string[]; // 複数画像対応
  tags: string[];
  menu?: { id: string; name: string }[];
}

export const SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'モーニング ブリュー カフェ',
    category: 'カフェ',
    distanceMinutes: 5,
    rating: 4.6,
    budget: '$',
    description: '一杯ずつハンドドリップで淹れるコーヒーと、静かな時間を楽しめる朝カフェ。',
    imageUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['コーヒー', '静かな空間', 'Wi-Fi'],
    menu: [
      { id: 'm-1-1', name: 'ハンドドリップ コーヒー' },
      { id: 'm-1-2', name: 'カフェラテ' },
      { id: 'm-1-3', name: 'シナモンロール' },
    ],
  },
  {
    id: 'shop-2',
    name: '夕焼け寿司割烹',
    category: 'レストラン',
    distanceMinutes: 11,
    rating: 4.8,
    budget: '$$$',
    description: '旬の魚を使ったおまかせコースが人気のカウンター寿司。',
    imageUrl:
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['寿司', 'カウンター', '記念日'],
    menu: [
      { id: 'm-2-1', name: 'おまかせコース' },
      { id: 'm-2-2', name: '白身三昧' },
      { id: 'm-2-3', name: '穴子一本握り' },
    ],
  },
  {
    id: 'shop-3',
    name: 'グロウ ヨガ スタジオ',
    category: 'ジム',
    distanceMinutes: 7,
    rating: 4.5,
    budget: '$$',
    description: 'キャンドルの灯りで行う夜ヨガと、朝のエナジーフローが評判のスタジオ。',
    imageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588286840104-8957b019727f?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ヨガ', 'コミュニティ', 'ドロップイン'],
  },
  {
    id: 'shop-4',
    name: 'ルーメン ワインバー',
    category: 'バー',
    distanceMinutes: 9,
    rating: 4.7,
    budget: '$$',
    description: '自然派ワインと季節の小皿料理、レコードの音色が心地よい隠れ家バー。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ワイン', '大人の雰囲気', '音楽'],
  },
  {
    id: 'shop-5',
    name: 'アーバングリーンズ キッチン',
    category: 'レストラン',
    distanceMinutes: 6,
    rating: 4.4,
    budget: '$$',
    description: '旬の野菜を使ったボウルとスープが揃うヘルシーランチスポット。',
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ヘルシー', 'テイクアウト', 'ランチ'],
  },
  {
    id: 'shop-6',
    name: 'ベイカーズ レーン',
    category: 'ベーカリー',
    distanceMinutes: 4,
    rating: 4.6,
    budget: '$',
    description: '焼きたてのクロワッサンとサワードウが並ぶ人気ベーカリー。',
    imageUrl:
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['パン', 'モーニング', 'テラス席'],
    menu: [
      { id: 'm-6-1', name: 'クロワッサン' },
      { id: 'm-6-2', name: 'サワードウ' },
      { id: 'm-6-3', name: 'チョコレートブレッド' },
    ],
  },
  {
    id: 'shop-7',
    name: 'インディゴ書房',
    category: '書店',
    distanceMinutes: 8,
    rating: 4.9,
    budget: '$$',
    description: 'ジャンルを越えて選書された本と、作家イベントが充実した書店。',
    imageUrl:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['本', 'トークイベント', 'ギフト'],
  },
  {
    id: 'shop-8',
    name: 'ロータス スパリトリート',
    category: 'サロン',
    distanceMinutes: 12,
    rating: 4.6,
    budget: '$$$',
    description: 'アロマトリートメントとフェイシャルで愛されるアーバンスパ。',
    imageUrl:
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['リラックス', 'アロマ', 'ご褒美'],
  },
  {
    id: 'shop-9',
    name: 'スカイハイ ワークスペース',
    category: 'ワークスペース',
    distanceMinutes: 10,
    rating: 4.5,
    budget: '$$',
    description: '天井の高い窓と集中できる個室を備えたコワーキングスペース。',
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['コワーキング', '会議室', 'イベント'],
  },
  {
    id: 'shop-10',
    name: 'レトロ アーケード ロフト',
    category: 'エンタメ',
    distanceMinutes: 13,
    rating: 4.4,
    budget: '$$',
    description: '懐かしのゲーム機とクラフトドリンクを気軽にできるナイトスポット。',
    imageUrl:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ゲーム', 'グループ', '夜遊び'],
  },
  {
    id: 'shop-11',
    name: 'ハーバー シーフード グリル',
    category: 'レストラン',
    distanceMinutes: 14,
    rating: 4.7,
    budget: '$$$',
    description: '海の幸をつかったグリル料理と景色が素晴らしいダイニング。',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['シーフード', 'ディナー', '予約制'],
  },
  {
    id: 'shop-12',
    name: 'リバーサイド ジャズクラブ',
    category: 'エンタメ',
    distanceMinutes: 13,
    rating: 4.7,
    budget: '$$',
    description: '生演奏のジャズと季節のカクテルを楽しめる大人の社交場。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ジャズ', 'ライブ', '夜景'],
  },
  {
    id: 'shop-13',
    name: 'クラフト アンド コード',
    category: 'ワークスペース',
    distanceMinutes: 11,
    rating: 4.5,
    budget: '$$',
    description: 'クリエイター向けのツールとイベントが揃うメイカーズロフト。',
    imageUrl:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['クリエイティブ', 'ワークショップ', 'テック'],
  },
  {
    id: 'shop-14',
    name: 'フレッシュ ボウル マーケット',
    category: 'ライフスタイル',
    distanceMinutes: 6,
    rating: 4.3,
    budget: '$$',
    description: 'サラダボウルとコールドプレスジュースが並ぶデリスタンド。',
    imageUrl:
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['デリ', 'テイクアウト', 'ヘルシー'],
  },
];

export const CATEGORIES: ShopCategory[] = Array.from(new Set(SHOPS.map(shop => shop.category)));
