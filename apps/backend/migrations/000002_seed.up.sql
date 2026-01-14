BEGIN;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'store_thumbnail',
    'morning_brew_cafe.jpg',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    'image/jpeg',
    FALSE,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'store_thumbnail',
    'sunset_sushi_kappo.jpg',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
    'image/jpeg',
    FALSE,
    NOW()
  );

INSERT INTO public.stores (
  store_id,
  thumbnail_file_id,
  name,
  opened_at,
  description,
  address,
  place_id,
  opening_hours,
  latitude,
  longitude,
  google_map_url,
  is_approved,
  created_at,
  updated_at
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'モーニング ブリュー カフェ',
    DATE '2024-10-12',
    '一杯ずつハンドドリップで淹れるコーヒーと、静かな時間を楽しめる朝カフェ。',
    '東京都内（モックデータ）',
    'ChIJRUjlH92OAGAR6otTD3tUcrg',
    NULL,
    35.681236,
    139.767125,
    'https://maps.google.com/?q=35.681236,139.767125',
    TRUE,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    '夕焼け寿司割烹',
    DATE '2020-08-14',
    '旬の魚を使ったおまかせコースが人気のカウンター寿司。',
    '大阪府内（モックデータ）',
    'ChIJRUjlH92OAGAR6otTD3tUcrg',
    NULL,
    34.693738,
    135.502165,
    'https://maps.google.com/?q=34.693738,135.502165',
    TRUE,
    NOW(),
    NOW()
  );

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111113',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ハンドドリップ コーヒー',
    600,
    '香り高いスペシャルティコーヒー。',
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111114',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'カフェラテ',
    720,
    'ミルクの甘みとバランスの良いエスプレッソ。',
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111115',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'シナモンロール',
    520,
    '朝の定番に合う焼きたてスイーツ。',
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'おまかせコース',
    9800,
    '旬の握りと季節の一品が楽しめるコース。',
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222224',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '白身三昧',
    4200,
    '淡白で上品な白身の食べ比べ。',
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222225',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '穴子一本握り',
    2600,
    'ふっくら煮上げた穴子を一本で。',
    NOW()
  );

INSERT INTO public.users (user_id, name, gender, birthday, email, icon_url, icon_file_id, provider, role, created_at, updated_at)
VALUES
  (
    '99999999-9999-9999-9999-999999999999',
    'シードユーザー',
    NULL,
    NULL,
    'seed@example.com',
    NULL,
    NULL,
    'seed',
    'user',
    NOW(),
    NOW()
  );

INSERT INTO public.reviews (review_id, store_id, user_id, rating, content, created_at, updated_at)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '99999999-9999-9999-9999-999999999999',
    5,
    '朝の時間にぴったりの一杯。コーヒーとシナモンロールの相性が最高でした。',
    NOW(),
    NOW()
  );

INSERT INTO public.review_menus (review_id, menu_id, created_at)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111113',
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111115',
    NOW()
  );

COMMIT;
