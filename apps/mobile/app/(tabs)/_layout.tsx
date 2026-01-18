import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HEADER_HEIGHT } from '@/constants/layout';
import { palette } from '@/constants/palette';
import { fonts } from '@/constants/typography';

export default function TabLayout() {
  const headerLogo = (
    <View style={styles.logoWrap}>
      <KuguriTitle
        width={120}
        height={42}
        preserveAspectRatio='xMidYMid meet'
        accessibilityLabel='Kuguriロゴ'
        fill={palette.textOnAccent}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style='light' backgroundColor={palette.accent} />
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: palette.textOnAccent,
            tabBarInactiveTintColor: palette.textOnAccent,
            tabBarLabelStyle: {
              fontFamily: fonts.medium,
              fontSize: 10,
              fontWeight: undefined,
            },
            headerStyle: styles.header,
            headerStatusBarHeight: 0,
            headerTitleAlign: 'center',
            headerShadowVisible: false,
            headerTitle: () => headerLogo,
            headerLeft: () => null,
            headerRight: () => null,
            headerTitleContainerStyle: styles.headerTitleContainer,
            tabBarButton: HapticTab,
            tabBarBackground: () => <View style={styles.tabBackground} />,
            tabBarStyle: Platform.select({
              ios: {
                // Use a transparent background on iOS to show the blur effect
                position: 'absolute',
              },
              default: {},
            }),
          }}
        >
          <Tabs.Screen
            name='index'
            options={{
              title: 'ホーム',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
            }}
          />
          <Tabs.Screen
            name='search'
            options={{
              title: '検索',
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name='magnifyingglass' color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name='favorites'
            options={{
              title: 'お気に入り',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name='heart.fill' color={color} />,
            }}
          />
          <Tabs.Screen
            name='mypage'
            options={{
              title: 'マイページ',
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name='person.crop.circle' color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.background,
    flex: 1,
  },
  header: {
    backgroundColor: palette.accent,
    height: HEADER_HEIGHT,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    backgroundColor: palette.accent,
    flex: 1,
  },
  tabBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.accent,
  },
});
