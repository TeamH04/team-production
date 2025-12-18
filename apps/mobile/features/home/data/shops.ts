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

export type ShopFeature =
  | 'Wi-Fi'
  | '電源'
  | '駐車場'
  | '禁煙'
  | '喫煙可'
  | '分煙'
  | '個室'
  | 'テラス席'
  | 'ペット可'
  | '予約可';

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
  latitude?: number;
  longitude?: number;
  reviewCount?: number;

  // 基本情報
  address: string;
  phoneNumber: string;
  operatingHours: string;
  regularHoliday: string;
  website?: string;
  features?: ShopFeature[];

  paymentMethods?: {
    cash?: boolean; // 現金対応可否
    transitAvailable?: boolean; // 交通系IC可否
    creditCard?: string[]; // クレジットカード系（VISA, MasterCard, JCB等）
    qrCode?: string[]; // QRコード決済（PayPay等）
    mobilePay?: string[]; // モバイル決済（Apple Pay, Google Pay等）
    transit?: string[]; // 交通系IC
    other?: string[]; // その他（iD, QUICPayなど）
  };
  menu?: {
    id: string;
    name: string;
    description?: string;
    price?: string;
    priceValue?: number;
    category?: string;
  }[];
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
    latitude: 35.662,
    longitude: 139.703,
    reviewCount: 124,
    address: '東京都渋谷区神南1-1-1',
    phoneNumber: '03-1234-5678',
    operatingHours: '08:00 - 20:00',
    regularHoliday: 'なし',
    website: 'https://example.com/morning-brew',
    features: ['Wi-Fi', '電源', '禁煙', 'テラス席'],
    paymentMethods: {
      cash: true,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard', 'JCB'],
      qrCode: ['PayPay', 'd払い', 'au PAY'],
      mobilePay: ['Apple Pay'],
      other: ['iD', 'QUICPay'],
    },
    menu: [
      {
        id: 'm-1-1',
        name: 'ハンドドリップ コーヒー',
        description: '注文ごとに淹れる香り豊かな一杯',
        price: '¥550',
        priceValue: 550,
        category: 'ドリンク',
      },
      {
        id: 'm-1-2',
        name: 'カフェラテ',
        description: 'ミルクの甘みがやさしい人気ドリンク',
        price: '¥620',
        priceValue: 620,
        category: 'ドリンク',
      },
      {
        id: 'm-1-3',
        name: 'シナモンロール',
        description: '焼きたてのふわふわ生地と香るシナモン',
        price: '¥480',
        priceValue: 480,
        category: 'フード',
      },
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
    latitude: 35.6607,
    longitude: 139.722,
    reviewCount: 88,
    address: '東京都港区西麻布2-2-2',
    phoneNumber: '03-2345-6789',
    operatingHours: '17:00 - 23:00',
    regularHoliday: '日曜日・祝日',
    features: ['禁煙', '個室', '予約可'],
    paymentMethods: {
      cash: false,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard', 'JCB'],
      mobilePay: ['Apple Pay'],
    },
    menu: [
      {
        id: 'm-2-1',
        name: 'おまかせコース',
        description: '旬の魚を中心にした握り12貫',
        price: '¥12,000',
        priceValue: 12000,
        category: 'コース',
      },
      {
        id: 'm-2-2',
        name: '白身三昧',
        description: '白身魚を贅沢に盛り合わせたセット',
        price: '¥3,600',
        priceValue: 3600,
        category: '握り',
      },
      {
        id: 'm-2-3',
        name: '穴子一本握り',
        description: 'ふわっと仕上げた名物の一本握り',
        price: '¥900',
        priceValue: 900,
        category: '握り',
      },
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
    latitude: 35.607,
    longitude: 139.668,
    reviewCount: 76,
    address: '東京都目黒区自由が丘3-3-3',
    phoneNumber: '03-3456-7890',
    operatingHours: '07:00 - 22:00',
    regularHoliday: '不定休',
    website: 'https://example.com/glow-yoga',
    features: ['禁煙', '予約可'],
    paymentMethods: {
      cash: true,
      transitAvailable: false,
      creditCard: ['VISA'],
      qrCode: ['PayPay'],
    },
    menu: [
      {
        id: 'm-3-1',
        name: '朝のエナジーフロー',
        description: '1日を整える60分のフロークラス',
        price: '¥2,400',
        priceValue: 2400,
        category: 'ドロップイン',
      },
      {
        id: 'm-3-2',
        name: 'キャンドルナイトヨガ',
        description: 'キャンドルの灯りで行うリラックスクラス',
        price: '¥2,800',
        priceValue: 2800,
        category: 'ドロップイン',
      },
      {
        id: 'm-3-3',
        name: '回数券（5回）',
        description: '有効期限3ヶ月の回数券',
        price: '¥10,500',
        priceValue: 10500,
        category: 'パス',
      },
    ],
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
    latitude: 35.6619,
    longitude: 139.666,
    reviewCount: 64,
    address: '東京都世田谷区下北沢4-4-4',
    phoneNumber: '03-4567-8901',
    operatingHours: '19:00 - 02:00',
    regularHoliday: '月曜日',
    features: ['禁煙', '予約可'],
    paymentMethods: {
      cash: true,
      transitAvailable: false,
      creditCard: ['VISA'],
    },
    menu: [
      {
        id: 'm-4-1',
        name: 'グラスワイン セレクション',
        description: '日替わりで楽しめる自然派グラスワイン',
        price: '¥1,200〜',
        priceValue: 1200,
        category: 'ドリンク',
      },
      {
        id: 'm-4-2',
        name: 'シャルキュトリー盛り合わせ',
        description: '生ハムとパテの人気プレート',
        price: '¥1,500',
        priceValue: 1500,
        category: 'フード',
      },
      {
        id: 'm-4-3',
        name: '季節の小皿3種',
        description: '旬の前菜を少しずつ楽しめるセット',
        price: '¥1,800',
        priceValue: 1800,
        category: 'フード',
      },
    ],
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
    latitude: 35.682,
    longitude: 139.766,
    reviewCount: 112,
    address: '東京都千代田区丸の内5-5-5',
    phoneNumber: '03-5678-9012',
    operatingHours: '11:00 - 21:00',
    regularHoliday: 'なし',
    website: 'https://example.com/urban-greens',
    features: ['Wi-Fi', '電源', '禁煙', 'テラス席'],
    paymentMethods: {
      cash: true,
      transitAvailable: true,
      creditCard: ['VISA', 'JCB'],
      qrCode: ['PayPay', 'au PAY'],
      mobilePay: ['Apple Pay'],
      other: ['QUICPay'],
    },
    menu: [
      {
        id: 'm-5-1',
        name: 'グリーンボウル',
        description: '旬の野菜と雑穀を使ったシグネチャー',
        price: '¥1,100',
        priceValue: 1100,
        category: 'ボウル',
      },
      {
        id: 'm-5-2',
        name: 'ロースト野菜プレート',
        description: '彩り野菜をオーブンでじっくりロースト',
        price: '¥1,350',
        priceValue: 1350,
        category: 'プレート',
      },
      {
        id: 'm-5-3',
        name: '季節のスープ',
        description: '日替わりで楽しめる野菜たっぷりスープ',
        price: '¥620',
        priceValue: 620,
        category: 'スープ',
      },
    ],
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
    latitude: 35.703,
    longitude: 139.579,
    reviewCount: 91,
    address: '東京都武蔵野市吉祥寺6-6-6',
    phoneNumber: '0422-12-3456',
    operatingHours: '07:30 - 19:00',
    regularHoliday: '火曜日',
    features: ['禁煙', 'テラス席', 'ペット可'],
    paymentMethods: {
      cash: true,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard'],
      qrCode: ['PayPay'],
      other: ['iD'],
    },
    menu: [
      {
        id: 'm-6-1',
        name: 'クロワッサン',
        description: '発酵バターをたっぷり使った看板商品',
        price: '¥260',
        priceValue: 260,
        category: 'パン',
      },
      {
        id: 'm-6-2',
        name: 'サワードウ',
        description: '自家製酵母で焼き上げた香り高い一品',
        price: '¥420',
        priceValue: 420,
        category: 'パン',
      },
      {
        id: 'm-6-3',
        name: 'チョコレートブレッド',
        description: 'ビターなチョコを練り込んだブレッド',
        price: '¥360',
        priceValue: 360,
        category: 'スイーツ',
      },
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
    address: '東京都千代田区神田神保町7-7-7',
    phoneNumber: '03-6789-0123',
    operatingHours: '10:00 - 21:00',
    regularHoliday: 'なし',
    features: ['Wi-Fi', '禁煙'],
    paymentMethods: {
      cash: true,
      transitAvailable: false,
      creditCard: ['VISA', 'MasterCard', 'JCB'],
      qrCode: ['PayPay', 'd払い'],
      mobilePay: ['Apple Pay'],
    },
  },
  {
    id: 'shop-8',
    name: 'ロータス スパリトリート',
    category: 'サロン',
    distanceMinutes: 12,
    rating: 4.6,
    budget: '$$$',
    description: 'アロマトリートメントとフェイシャルで愛やされるアーバンスパ。',
    imageUrl:
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['リラックス', 'アロマ', 'ご褒美'],
    address: '東京都港区南青山8-8-8',
    phoneNumber: '03-7890-1234',
    operatingHours: '11:00 - 20:00',
    regularHoliday: '水曜日',
    website: 'https://example.com/lotus-spa',
    features: ['禁煙', '個室', '予約可'],
    paymentMethods: {
      cash: false,
      transitAvailable: false,
      creditCard: ['VISA', 'MasterCard', 'JCB'],
      mobilePay: ['Apple Pay'],
    },
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
    address: '東京都新宿区西新宿9-9-9',
    phoneNumber: '03-8901-2345',
    operatingHours: '09:00 - 23:00',
    regularHoliday: 'なし',
    website: 'https://example.com/skyhigh-work',
    features: ['Wi-Fi', '電源', '禁煙', '個室', '予約可'],
    paymentMethods: {
      cash: false,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard'],
      qrCode: ['PayPay', 'd払い'],
      other: ['iD', 'QUICPay'],
    },
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
    address: '東京都千代田区秋葉原10-10-10',
    phoneNumber: '03-9012-3456',
    operatingHours: '16:00 - 24:00',
    regularHoliday: '不定休',
    features: ['Wi-Fi', '喫煙可', '予約可'],
    paymentMethods: {
      cash: true,
      transitAvailable: false,
      creditCard: ['VISA', 'JCB'],
      qrCode: ['PayPay', 'au PAY'],
      other: ['iD'],
    },
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
    address: '東京都港区台場11-11-11',
    phoneNumber: '03-0123-4567',
    operatingHours: '17:30 - 23:00',
    regularHoliday: '月曜日',
    website: 'https://example.com/harbor-grill',
    features: ['禁煙', 'テラス席', '個室', '予約可'],
    paymentMethods: {
      cash: true,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard', 'JCB'],
      mobilePay: ['Apple Pay'],
      other: ['QUICPay'],
    },
  },
  {
    id: 'shop-12',
    name: 'リバーサイド ジャズクラブ',
    category: 'エンタメ',
    distanceMinutes: 13,
    rating: 4.7,
    budget: '$$',
    description: '生演奏のジャズと季節のカクテルを気味める大人の社交場。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ジャズ', 'ライブ', '夜景'],
    address: '東京都墨田区向島12-12-12',
    phoneNumber: '03-1234-9876',
    operatingHours: '19:00 - 03:00',
    regularHoliday: '日曜日',
    features: ['喫煙可', '予約可'],
    paymentMethods: {
      cash: true,
      transitAvailable: false,
      creditCard: ['VISA', 'MasterCard'],
      qrCode: ['PayPay'],
      other: ['iD'],
    },
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
    address: '東京都渋谷区道玄坂13-13-13',
    phoneNumber: '03-2345-8765',
    operatingHours: '10:00 - 22:00',
    regularHoliday: 'なし',
    website: 'https://example.com/craft-code',
    features: ['Wi-Fi', '電源', '禁煙'],
    paymentMethods: {
      cash: false,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard'],
      qrCode: ['PayPay', 'd払い'],
      mobilePay: ['Apple Pay'],
      other: ['QUICPay'],
    },
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
    address: '東京都港区六本木14-14-14',
    phoneNumber: '03-3456-7654',
    operatingHours: '08:00 - 20:00',
    regularHoliday: '不定休',
    website: 'https://example.com/fresh-bowl',
    features: ['Wi-Fi', '禁煙', 'テラス席'],
    paymentMethods: {
      cash: true,
      transitAvailable: true,
      creditCard: ['VISA', 'MasterCard'],
      qrCode: ['PayPay', 'au PAY'],
      mobilePay: ['Apple Pay'],
      other: ['iD'],
    },
  },
];

export const CATEGORIES: ShopCategory[] = Array.from(new Set(SHOPS.map(shop => shop.category)));
