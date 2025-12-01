import { Stack } from 'expo-router';

export default function ShopStackLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: '店舗詳細', headerShown: true }} />
      <Stack.Screen name='review' options={{ title: 'レビューを投稿', presentation: 'modal' }} />
    </Stack>
  );
}
