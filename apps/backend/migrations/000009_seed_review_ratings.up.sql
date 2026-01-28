BEGIN;

INSERT INTO public.reviews (
  review_id,
  store_id,
  user_id,
  rating,
  content,
  created_at,
  updated_at
)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '99999999-9999-9999-9999-999999999999',
    5,
    '朝の時間にぴったりの一杯。コーヒーとシナモンロールの相性が最高でした。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444441',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '88888888-8888-8888-8888-888888888888',
    4,
    '開店直後は落ち着いていて集中できます。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '77777777-7777-7777-7777-777777777777',
    5,
    'ラテが絶品。スタッフの気配りも素晴らしい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '66666666-6666-6666-6666-666666666666',
    3,
    '席数が少なめなので早めの来店がおすすめ。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '99999999-9999-9999-9999-999999999999',
    4,
    '朝食メニューが増えていて嬉しい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '77777777-7777-7777-7777-777777777777',
    5,
    '豆の説明をしてくれて選ぶ時間も楽しい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444446',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '88888888-8888-8888-8888-888888888888',
    4,
    'テイクアウトもスムーズで便利でした。目安箱: 受け取り待ちの椅子があると助かります。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444447',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '88888888-8888-8888-8888-888888888888',
    4,
    '朝の光が入り、読書にぴったり。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444448',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '77777777-7777-7777-7777-777777777777',
    5,
    '焼き菓子が香ばしく、コーヒーと相性抜群。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444449',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '66666666-6666-6666-6666-666666666666',
    3,
    'Wi-Fiが少し不安定。目安箱: 電源席を増やしてほしい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444450',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '99999999-9999-9999-9999-999999999999',
    4,
    '静かで作業しやすい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444451',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '88888888-8888-8888-8888-888888888888',
    5,
    '豆の種類が豊富で選ぶのが楽しい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444452',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '77777777-7777-7777-7777-777777777777',
    4,
    '季節ラテの香りが良かった。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444453',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '66666666-6666-6666-6666-666666666666',
    2,
    '週末は混雑し待ち時間が長め。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444454',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '99999999-9999-9999-9999-999999999999',
    4,
    '接客が丁寧で安心。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444455',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '88888888-8888-8888-8888-888888888888',
    5,
    'モーニングセットがお得。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444456',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '77777777-7777-7777-7777-777777777777',
    4,
    'テイクアウトの包装が丁寧。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444457',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '66666666-6666-6666-6666-666666666666',
    3,
    '席間隔がやや狭い。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444458',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '99999999-9999-9999-9999-999999999999',
    5,
    '朝のBGMが心地よい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444459',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '88888888-8888-8888-8888-888888888888',
    4,
    'スコーンがしっとりしていて美味しい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444460',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '77777777-7777-7777-7777-777777777777',
    5,
    'バリスタの説明が分かりやすい。',
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444461',
    '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
    '66666666-6666-6666-6666-666666666666',
    3,
    '目安箱: レジ周りの導線を改善してほしい。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555551',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '77777777-7777-7777-7777-777777777777',
    5,
    '一貫ずつ丁寧で、特に白身が美味しかった。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '66666666-6666-6666-6666-666666666666',
    4,
    'コースのボリュームがちょうど良い。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '88888888-8888-8888-8888-888888888888',
    5,
    'おまかせコースの温度感が完璧。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555554',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '99999999-9999-9999-9999-999999999999',
    4,
    '目安箱: 予約枠をもう少し広げてほしい。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '77777777-7777-7777-7777-777777777777',
    5,
    '赤酢のシャリが香り高い。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '66666666-6666-6666-6666-666666666666',
    4,
    '静かな雰囲気で落ち着ける。',
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555557',
    'ef9c168b-c258-41af-80a6-747a7802e0b4',
    '88888888-8888-8888-8888-888888888888',
    3,
    '価格は高めだが品質は良い。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666661',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '88888888-8888-8888-8888-888888888888',
    5,
    'プレートの盛り付けがきれいで写真映えします。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '99999999-9999-9999-9999-999999999999',
    3,
    '混雑していたけど味は満足。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '66666666-6666-6666-6666-666666666666',
    4,
    'スパイスチキンが柔らかくて食べやすい。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666664',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '77777777-7777-7777-7777-777777777777',
    4,
    'テラス席が気持ちいいので晴れの日におすすめ。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666665',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '77777777-7777-7777-7777-777777777777',
    4,
    '港町らしいメニューが楽しめる。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '66666666-6666-6666-6666-666666666666',
    5,
    '魚介が新鮮で香りが良い。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666667',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '99999999-9999-9999-9999-999999999999',
    3,
    '目安箱: ランチ列の案内を分かりやすくしてほしい。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666668',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '88888888-8888-8888-8888-888888888888',
    4,
    'ドリンクのバリエーションが豊富。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666669',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '77777777-7777-7777-7777-777777777777',
    4,
    'テラス席の風が気持ちいい。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666670',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '66666666-6666-6666-6666-666666666666',
    2,
    '混雑時は提供が遅め。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666671',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '99999999-9999-9999-9999-999999999999',
    5,
    'サラダが新鮮でシャキシャキ。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666672',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '88888888-8888-8888-8888-888888888888',
    4,
    'スパイスの香りが食欲をそそる。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666673',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '77777777-7777-7777-7777-777777777777',
    3,
    '子連れでも利用しやすい。',
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666674',
    '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
    '66666666-6666-6666-6666-666666666666',
    4,
    '夜の雰囲気が落ち着いていて良い。',
    NOW(),
    NOW()
  )
ON CONFLICT (review_id) DO NOTHING;

INSERT INTO public.review_menus (review_id, menu_id, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '95a17a73-980b-4dc3-b48a-c738d25d632e', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'b70c786d-36b3-4b27-b5aa-44c2372fa42f', NOW()),
  ('44444444-4444-4444-4444-444444444441', '57f1929f-28a5-4b14-bab8-8de42abc72d0', NOW()),
  ('44444444-4444-4444-4444-444444444442', '95a17a73-980b-4dc3-b48a-c738d25d632e', NOW()),
  ('55555555-5555-5555-5555-555555555551', '74328f48-4517-4857-a137-003bebf99f87', NOW()),
  ('55555555-5555-5555-5555-555555555552', '895dd376-13bf-4a3b-9171-6fe47c330afb', NOW()),
  ('55555555-5555-5555-5555-555555555553', 'b3d7625d-0475-4208-8112-7301df44baf5', NOW()),
  ('66666666-6666-6666-6666-666666666661', 'b1db14b4-fd9c-4431-be39-ff19027468e2', NOW()),
  ('66666666-6666-6666-6666-666666666662', 'eff3d6bf-88ae-4c94-b4a0-d8c93fc2ab86', NOW())
ON CONFLICT DO NOTHING;

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '33333333-3333-3333-3333-333333333333';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 3,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444441';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444442';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 3,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444443';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444444';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 5,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444445';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 5,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444446';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '55555555-5555-5555-5555-555555555551';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '55555555-5555-5555-5555-555555555552';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '66666666-6666-6666-6666-666666666661';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 2,
  rating_cleanliness = 3
WHERE review_id = '66666666-6666-6666-6666-666666666662';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666663';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666664';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444447';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444448';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 2,
  rating_cleanliness = 3
WHERE review_id = '44444444-4444-4444-4444-444444444449';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444450';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '44444444-4444-4444-4444-444444444451';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444452';

UPDATE public.reviews
SET
  rating_taste = 2,
  rating_atmosphere = 2,
  rating_service = 2,
  rating_speed = 2,
  rating_cleanliness = 3
WHERE review_id = '44444444-4444-4444-4444-444444444453';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444454';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '44444444-4444-4444-4444-444444444455';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 5,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444456';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 3,
  rating_cleanliness = 3
WHERE review_id = '44444444-4444-4444-4444-444444444457';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '44444444-4444-4444-4444-444444444458';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444459';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '44444444-4444-4444-4444-444444444460';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 3,
  rating_cleanliness = 3
WHERE review_id = '44444444-4444-4444-4444-444444444461';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '55555555-5555-5555-5555-555555555553';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '55555555-5555-5555-5555-555555555554';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 5,
  rating_service = 5,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '55555555-5555-5555-5555-555555555555';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '55555555-5555-5555-5555-555555555556';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 3,
  rating_cleanliness = 3
WHERE review_id = '55555555-5555-5555-5555-555555555557';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666665';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '66666666-6666-6666-6666-666666666666';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 2,
  rating_cleanliness = 3
WHERE review_id = '66666666-6666-6666-6666-666666666667';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666668';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 5,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666669';

UPDATE public.reviews
SET
  rating_taste = 2,
  rating_atmosphere = 2,
  rating_service = 2,
  rating_speed = 2,
  rating_cleanliness = 2
WHERE review_id = '66666666-6666-6666-6666-666666666670';

UPDATE public.reviews
SET
  rating_taste = 5,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 5
WHERE review_id = '66666666-6666-6666-6666-666666666671';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666672';

UPDATE public.reviews
SET
  rating_taste = 3,
  rating_atmosphere = 3,
  rating_service = 3,
  rating_speed = 3,
  rating_cleanliness = 3
WHERE review_id = '66666666-6666-6666-6666-666666666673';

UPDATE public.reviews
SET
  rating_taste = 4,
  rating_atmosphere = 4,
  rating_service = 4,
  rating_speed = 4,
  rating_cleanliness = 4
WHERE review_id = '66666666-6666-6666-6666-666666666674';

COMMIT;
