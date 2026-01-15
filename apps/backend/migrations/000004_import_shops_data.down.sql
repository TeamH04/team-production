BEGIN;

DELETE FROM public.stores
WHERE store_id IN (
  '1ebef6bc-9dd4-4c74-862f-53a1728322a3',
  'ef9c168b-c258-41af-80a6-747a7802e0b4',
  'babedee5-6044-4ff7-adf7-ab211ce47201',
  '0459a380-3fb0-452e-b246-858a0f83da06',
  '90b44899-12d9-4b0d-8cc7-57cb2ccb4bca',
  'a6c4d00c-eb5a-4f67-a230-d819dd63f7d9',
  'a3caea16-843a-4e7b-8c77-f41a79810048',
  'b29e60ce-6fec-4ffa-9055-b510b18fe0d7',
  '67b63f0e-a1df-407e-8cf8-61d4657f0659',
  'eddcf927-6f88-447e-9e22-d1f68ecf99e8',
  '7c5255e4-2e2d-4192-991f-5b10c57dcc8c'
);

-- Delete seeded files inserted by the up migration
DELETE FROM public.files
WHERE file_id IN (
  'ebc53e26-915c-4175-8015-256399c9b081',
  '59d605f7-e856-4905-9b5b-4ce009c0858f',
  '0a165096-d715-4a60-a032-84ba714f1cbf',
  '55c81da6-8a15-4388-9c47-358fd4b9d39b',
  '0868938e-719b-4c06-8a85-71ded5db162f',
  '1b445de7-f493-4f58-8753-0651caaa197e',
  '650de8fa-0fcf-4af9-921c-c73933771835',
  'fe68d11c-990d-4fb5-95b0-fc900238d657',
  'fbd3b170-2834-4666-a866-3bf273869a1c',
  '00611bc1-3ae4-45d7-821f-72f3104eff92',
  'd4d4ec38-5625-4afa-a5f6-6436cc8be673',
  'bda40189-1cf1-406e-9133-6aef5811957e',
  '4eea9782-9d06-417a-af79-78e0bc61d684',
  '7c06d7b8-89ea-410f-8127-b7a719f6d00d',
  'ee55dbcb-e1d3-4b73-b46d-51a6bd85246c',
  '0cc07d31-a220-4b0f-971d-5e857e040afb'
);

COMMIT;
