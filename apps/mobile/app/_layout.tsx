import { FavoritesProvider } from '@/features/favorites/FavoritesContext';
import { ReviewsProvider } from '@/features/reviews/ReviewsContext';
import { UserProvider } from '@/features/user/UserContext';
import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';

const layoutColors = {
  surface: '#FFFFFF',
} as const;

const styles = StyleSheet.create({
  container: {
    backgroundColor: layoutColors.surface,
    flex: 1,
  },
});

function RootStack() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const first = segments[0] ?? '';
  const padTop = first !== 'shop' && first !== 'profile' ? insets.top : 0;
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: padTop,
        },
      ]}
    >
      <StatusBar hidden={false} style='dark' backgroundColor='transparent' />
      <Stack>
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='login' options={{ title: 'ログイン', headerShown: true }} />
        <Stack.Screen name='owner/signup' options={{ title: 'オーナー登録', headerShown: true }} />
        <Stack.Screen name='auth/callback' options={{ title: '認証', headerShown: true }} />
        <Stack.Screen name='+not-found' />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <UserProvider>
          <FavoritesProvider>
            <ReviewsProvider>
              <RootStack />
            </ReviewsProvider>
          </FavoritesProvider>
        </UserProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
