import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='edit'
        options={{
          title: 'プロフィール編集',
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
