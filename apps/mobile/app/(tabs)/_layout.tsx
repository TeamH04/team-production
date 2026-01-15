import KuguriTitle from '@/assets/icons/kaguri.svg';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HEADER_HEIGHT } from '@/constants/layout';
import { palette } from '@/constants/palette';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const headerLogo = (
    <View style={styles.logoWrap}>
      <KuguriTitle
        width='32%'
        height='100%'
        preserveAspectRatio='xMidYMid meet'
        accessibilityLabel='Kuguriロゴ'
        fill={palette.textOnAccent}
        style={{ transform: [{ translateY: -5 }] }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style='light' backgroundColor={palette.accent} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: palette.textOnAccent,
          tabBarInactiveTintColor: palette.textOnAccent,
          headerStyle: styles.header,
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerTitle: () => headerLogo,
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
    width: '100%',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 0,
    paddingTop: 10,
  },
  tabBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.accent,
  },
});
