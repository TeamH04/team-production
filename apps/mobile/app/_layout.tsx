import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <StatusBar hidden={false} style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaView>
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
        <RootStack />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
