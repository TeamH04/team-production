-- Migration generated from packages/shop-core/src/shops.ts
BEGIN;

-- Remove old seed data to avoid duplicates
DELETE FROM public.stores WHERE store_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.files WHERE file_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Insert File for URL: https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('ebc53e26-915c-4175-8015-256399c9b081', 'store_thumbnail', 'thumbnail_shop-1.jpg', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: モーニング ブリュー カフェ
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'ebc53e26-915c-4175-8015-256399c9b081', 'モーニング ブリュー カフェ', '2024-10-12', '一杯ずつハンドドリップで淹れるコーヒーと、静かな時間を楽しめる朝カフェ。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'カフェ・喫茶', '$', 4.6, 5, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'ebc53e26-915c-4175-8015-256399c9b081')
ON CONFLICT DO NOTHING;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('59d605f7-e856-4905-9b5b-4ce009c0858f', 'store_image', 'image_shop-1_1.jpg', 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('1ebef6bc-9dd4-4c74-862f-53a1728322a3', '59d605f7-e856-4905-9b5b-4ce009c0858f')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('95a17a73-980b-4dc3-b48a-c738d25d632e', '1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'ハンドドリップ コーヒー', 550, 'ドリンク', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('57f1929f-28a5-4b14-bab8-8de42abc72d0', '1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'カフェラテ', 620, 'ドリンク', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('b70c786d-36b3-4b27-b5aa-44c2372fa42f', '1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'シナモンロール', 480, 'スイーツ', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'コーヒー')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('1ebef6bc-9dd4-4c74-862f-53a1728322a3', '静かな空間')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('1ebef6bc-9dd4-4c74-862f-53a1728322a3', 'Wi-Fi')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('0a165096-d715-4a60-a032-84ba714f1cbf', 'store_thumbnail', 'thumbnail_shop-2.jpg', 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: 夕焼け寿司割烹
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('ef9c168b-c258-41af-80a6-747a7802e0b4', '0a165096-d715-4a60-a032-84ba714f1cbf', '夕焼け寿司割烹', '2020-08-14', '旬の魚を使ったおまかせコースが人気のカウンター寿司。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'レストラン', '$$$', 4.8, 11, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('ef9c168b-c258-41af-80a6-747a7802e0b4', '0a165096-d715-4a60-a032-84ba714f1cbf')
ON CONFLICT DO NOTHING;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('55c81da6-8a15-4388-9c47-358fd4b9d39b', 'store_image', 'image_shop-2_2.jpg', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('ef9c168b-c258-41af-80a6-747a7802e0b4', '55c81da6-8a15-4388-9c47-358fd4b9d39b')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('74328f48-4517-4857-a137-003bebf99f87', 'ef9c168b-c258-41af-80a6-747a7802e0b4', '特選おまかせコース', 18000, 'ディナー', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('895dd376-13bf-4a3b-9171-6fe47c330afb', 'ef9c168b-c258-41af-80a6-747a7802e0b4', '白身三昧ランチ', 3500, 'ランチ', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('b3d7625d-0475-4208-8112-7301df44baf5', 'ef9c168b-c258-41af-80a6-747a7802e0b4', '穴子一本握り', 1200, 'ランチ', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('ef9c168b-c258-41af-80a6-747a7802e0b4', '寿司')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('ef9c168b-c258-41af-80a6-747a7802e0b4', 'カウンター')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('ef9c168b-c258-41af-80a6-747a7802e0b4', '記念日')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('0868938e-719b-4c06-8a85-71ded5db162f', 'store_thumbnail', 'thumbnail_shop-3.jpg', 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: グロウ ジェラート ラボ
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('babedee5-6044-4ff7-adf7-ab211ce47201', '0868938e-719b-4c06-8a85-71ded5db162f', 'グロウ ジェラート ラボ', '2023-09-05', '旬のフルーツを使ったジェラートと焼き菓子の専門店。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'スイーツ・デザート専門', '$$', 4.7, 7, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('babedee5-6044-4ff7-adf7-ab211ce47201', '0868938e-719b-4c06-8a85-71ded5db162f')
ON CONFLICT DO NOTHING;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('1b445de7-f493-4f58-8753-0651caaa197e', 'store_image', 'image_shop-3_1.jpg', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('babedee5-6044-4ff7-adf7-ab211ce47201', '1b445de7-f493-4f58-8753-0651caaa197e')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('f6d2f056-993f-4339-9a92-c6d83285bb78', 'babedee5-6044-4ff7-adf7-ab211ce47201', 'ピスタチオ ジェラート', 750, 'ジェラート', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('bf5e8234-4989-44f0-ad9d-ba209a47433d', 'babedee5-6044-4ff7-adf7-ab211ce47201', '塩キャラメル クッキーサンド', 580, '焼き菓子', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('977fe66d-ff2c-41c7-a8c4-eb3772bd5250', 'babedee5-6044-4ff7-adf7-ab211ce47201', '季節のフルーツパフェ', 1650, 'ジェラート', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('babedee5-6044-4ff7-adf7-ab211ce47201', 'ジェラート')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('babedee5-6044-4ff7-adf7-ab211ce47201', '季節限定')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('babedee5-6044-4ff7-adf7-ab211ce47201', 'イートイン')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('650de8fa-0fcf-4af9-921c-c73933771835', 'store_thumbnail', 'thumbnail_shop-4.jpg', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: ルーメン ワインバー
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('0459a380-3fb0-452e-b246-858a0f83da06', '650de8fa-0fcf-4af9-921c-c73933771835', 'ルーメン ワインバー', '2019-11-30', '自然派ワインと季節の小皿料理、レコードの音色が心地よい隠れ家バー。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'バー・居酒屋', '$$', 4.7, 9, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('0459a380-3fb0-452e-b246-858a0f83da06', '650de8fa-0fcf-4af9-921c-c73933771835')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('a11fc58d-2806-47f2-8680-edfa557d96ee', '0459a380-3fb0-452e-b246-858a0f83da06', 'グラスワイン', 1100, 'お酒', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('ebc02b5f-e6f2-43e7-a45e-6b4a03fcdc3f', '0459a380-3fb0-452e-b246-858a0f83da06', '生ハム盛り合わせ', 1600, 'おつまみ', NOW())
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO public.store_tags (store_id, tag)
VALUES ('0459a380-3fb0-452e-b246-858a0f83da06', 'ワイン')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('0459a380-3fb0-452e-b246-858a0f83da06', '大人の雰囲気')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('0459a380-3fb0-452e-b246-858a0f83da06', '音楽')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('fe68d11c-990d-4fb5-95b0-fc900238d657', 'store_thumbnail', 'thumbnail_shop-5.jpg', 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: アーバングリーンズ キッチン
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'fe68d11c-990d-4fb5-95b0-fc900238d657', 'アーバングリーンズ キッチン', '2024-02-18', '旬の野菜を使ったボウルとスープが揃うヘルシーランチスポット。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'レストラン', '$$', 4.4, 6, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'fe68d11c-990d-4fb5-95b0-fc900238d657')
ON CONFLICT DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', '55c81da6-8a15-4388-9c47-358fd4b9d39b')
ON CONFLICT DO NOTHING;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('fbd3b170-2834-4666-a866-3bf273869a1c', 'store_image', 'image_shop-5_2.jpg', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'fbd3b170-2834-4666-a866-3bf273869a1c')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('b1db14b4-fd9c-4431-be39-ff19027468e2', '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'ヴィーガンサラダセット', 1450, 'ランチ', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('eff3d6bf-88ae-4c94-b4a0-d8c93fc2ab86', '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'デトックススープ', 980, 'ランチ', NOW())
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO public.store_tags (store_id, tag)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'ヘルシー')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'テイクアウト')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('90b44899-12d9-4b0d-8cc7-57cb2ccb4bca', 'ランチ')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('00611bc1-3ae4-45d7-821f-72f3104eff92', 'store_thumbnail', 'thumbnail_shop-6.jpg', 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: ベイカーズ レーン
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', '00611bc1-3ae4-45d7-821f-72f3104eff92', 'ベイカーズ レーン', '2025-01-22', '焼きたてのクロワッサンとサワードウが並ぶ人気ベーカリー。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'ベーカリー・パン', '$', 4.6, 4, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', '00611bc1-3ae4-45d7-821f-72f3104eff92')
ON CONFLICT DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', 'ebc53e26-915c-4175-8015-256399c9b081')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('2cce5c0f-5ad0-4bb0-96ee-736dca790596', 'a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', '明太フランス', 320, '惣菜パン', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('46dc7c4a-b5f6-43dd-9a46-bd5189764cb8', 'a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', '焼きたてクロワッサン', 280, '菓子パン', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('c102e5eb-4091-444d-975c-ed55a5301209', 'a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', 'アイスコーヒー', 450, 'ドリンク', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', 'パン')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', 'モーニング')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('a6c4d00c-eb5a-4f67-a230-d819dd63f7d9', 'テラス席')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('d4d4ec38-5625-4afa-a5f6-6436cc8be673', 'store_thumbnail', 'thumbnail_shop-8.jpg', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: ロータス ベジビュッフェ
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('a3caea16-843a-4e7b-8c77-f41a79810048', 'd4d4ec38-5625-4afa-a5f6-6436cc8be673', 'ロータス ベジビュッフェ', '2023-12-01', '旬野菜とスパイス料理をビュッフェ形式で楽しめるヘルシーダイニング。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'ビュッフェ・食べ放題', '$$', 4.6, 12, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('a3caea16-843a-4e7b-8c77-f41a79810048', 'd4d4ec38-5625-4afa-a5f6-6436cc8be673')
ON CONFLICT DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('a3caea16-843a-4e7b-8c77-f41a79810048', '1b445de7-f493-4f58-8753-0651caaa197e')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('e61d3601-e501-4f35-9606-d0adf522c66f', 'a3caea16-843a-4e7b-8c77-f41a79810048', 'ランチ食べ放題', 2800, '料理', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('fcb79342-414c-4bba-bef4-83c5a62de7b9', 'a3caea16-843a-4e7b-8c77-f41a79810048', '豆腐のヘルシープリン', 450, 'デザート', NOW())
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO public.store_tags (store_id, tag)
VALUES ('a3caea16-843a-4e7b-8c77-f41a79810048', 'ビュッフェ')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('a3caea16-843a-4e7b-8c77-f41a79810048', '野菜たっぷり')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('a3caea16-843a-4e7b-8c77-f41a79810048', 'スパイス')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('bda40189-1cf1-406e-9133-6aef5811957e', 'store_thumbnail', 'thumbnail_shop-10.jpg', 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: レトロ アーケード ロフト
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('b29e60ce-6fec-4ffa-9055-b510b18fe0d7', 'bda40189-1cf1-406e-9133-6aef5811957e', 'レトロ アーケード ロフト', '2021-07-14', '懐かしのゲーム機とクラフトドリンクを気軽にできるナイトスポット。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'バー・居酒屋', '$$', 4.4, 13, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('b29e60ce-6fec-4ffa-9055-b510b18fe0d7', 'bda40189-1cf1-406e-9133-6aef5811957e')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('902fd2fc-9b38-453c-85e0-1845da49fe80', 'b29e60ce-6fec-4ffa-9055-b510b18fe0d7', '自家製ナチョス', 850, 'おつまみ', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('079761a3-8985-46f9-ab04-47ea9abc56fb', 'b29e60ce-6fec-4ffa-9055-b510b18fe0d7', 'レトロソーダカクテル', 750, 'お酒', NOW())
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO public.store_tags (store_id, tag)
VALUES ('b29e60ce-6fec-4ffa-9055-b510b18fe0d7', 'ゲーム')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('b29e60ce-6fec-4ffa-9055-b510b18fe0d7', 'グループ')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('b29e60ce-6fec-4ffa-9055-b510b18fe0d7', '夜遊び')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('4eea9782-9d06-417a-af79-78e0bc61d684', 'store_thumbnail', 'thumbnail_shop-11.jpg', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: ハーバー シーフード グリル
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('67b63f0e-a1df-407e-8cf8-61d4657f0659', '4eea9782-9d06-417a-af79-78e0bc61d684', 'ハーバー シーフード グリル', '2021-12-06', '海の幸をつかったグリル料理と景色が素晴らしいダイニング。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'レストラン', '$$$', 4.7, 14, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('67b63f0e-a1df-407e-8cf8-61d4657f0659', '4eea9782-9d06-417a-af79-78e0bc61d684')
ON CONFLICT DO NOTHING;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('7c06d7b8-89ea-410f-8127-b7a719f6d00d', 'store_image', 'image_shop-11_1.jpg', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('67b63f0e-a1df-407e-8cf8-61d4657f0659', '7c06d7b8-89ea-410f-8127-b7a719f6d00d')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('4ef632d3-afcd-4192-8549-ff961265d6ed', '67b63f0e-a1df-407e-8cf8-61d4657f0659', '本日のお魚グリル', 4200, 'ディナー', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('cd614c8c-2873-4be2-a165-587205dc6fd4', '67b63f0e-a1df-407e-8cf8-61d4657f0659', '白ワイン グラス', 950, 'ドリンク', NOW())
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO public.store_tags (store_id, tag)
VALUES ('67b63f0e-a1df-407e-8cf8-61d4657f0659', 'シーフード')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('67b63f0e-a1df-407e-8cf8-61d4657f0659', 'ディナー')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('67b63f0e-a1df-407e-8cf8-61d4657f0659', '予約制')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Shop: リバーサイド ジャズクラブ
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('eddcf927-6f88-447e-9e22-d1f68ecf99e8', '650de8fa-0fcf-4af9-921c-c73933771835', 'リバーサイド ジャズクラブ', '2024-07-30', '生演奏のジャズと季節のカクテルを楽しめる大人の社交場。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'バー・居酒屋', '$$', 4.7, 13, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('eddcf927-6f88-447e-9e22-d1f68ecf99e8', '650de8fa-0fcf-4af9-921c-c73933771835')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('9adc7927-b9fd-4678-a4a5-773ba791dc4e', 'eddcf927-6f88-447e-9e22-d1f68ecf99e8', 'クラフトジントニック', 1350, 'お酒', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('0cca007a-1efd-45d6-bf47-6240e62154c8', 'eddcf927-6f88-447e-9e22-d1f68ecf99e8', 'ミックスナッツ燻製', 650, 'おつまみ', NOW())
ON CONFLICT (menu_id) DO NOTHING;

INSERT INTO public.store_tags (store_id, tag)
VALUES ('eddcf927-6f88-447e-9e22-d1f68ecf99e8', 'ジャズ')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('eddcf927-6f88-447e-9e22-d1f68ecf99e8', 'ライブ')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('eddcf927-6f88-447e-9e22-d1f68ecf99e8', '夜景')
ON CONFLICT (store_id, tag) DO NOTHING;


-- Insert File for URL: https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80
INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('ee55dbcb-e1d3-4b73-b46d-51a6bd85246c', 'store_thumbnail', 'thumbnail_shop-14.jpg', 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

-- Shop: フレッシュ ボウル マーケット
INSERT INTO public.stores (store_id, thumbnail_file_id, name, opened_at, description, address, place_id, latitude, longitude, category, budget, average_rating, distance_minutes, is_approved, created_at, updated_at)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'ee55dbcb-e1d3-4b73-b46d-51a6bd85246c', 'フレッシュ ボウル マーケット', '2023-02-14', 'サラダボウルとコールドプレスジュースが並ぶデリスタンド。', '東京都内', 'ChIJRUjlH92OAGAR6otTD3tUcrg', 35.681236, 139.767125, 'ファストフード・テイクアウト', '$$', 4.3, 6, TRUE, '2025-02-01T00:00:00.000Z', NOW())
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'ee55dbcb-e1d3-4b73-b46d-51a6bd85246c')
ON CONFLICT DO NOTHING;

INSERT INTO public.files (file_id, file_kind, file_name, object_key, content_type, is_deleted, created_at)
VALUES ('0cc07d31-a220-4b0f-971d-5e857e040afb', 'store_image', 'image_shop-14_1.jpg', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 'image/jpeg', FALSE, NOW())
ON CONFLICT (object_key) DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', '0cc07d31-a220-4b0f-971d-5e857e040afb')
ON CONFLICT DO NOTHING;

INSERT INTO public.store_files (store_id, file_id)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', '55c81da6-8a15-4388-9c47-358fd4b9d39b')
ON CONFLICT DO NOTHING;

INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('dfcd8e70-8e86-4249-ac9c-419799fb8b66', '7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'サーモンPokeボウル', 1580, 'メイン', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.menus (menu_id, store_id, name, price, description, created_at)
VALUES ('e952a98b-709b-4632-8b42-ac557e093a78', '7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'オレンジジュース', 680, 'ドリンク', NOW())
ON CONFLICT (menu_id) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'デリ')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'テイクアウト')
ON CONFLICT (store_id, tag) DO NOTHING;
INSERT INTO public.store_tags (store_id, tag)
VALUES ('7c5255e4-2e2d-4192-991f-5b10c57dcc8c', 'ヘルシー')
ON CONFLICT (store_id, tag) DO NOTHING;

COMMIT;
