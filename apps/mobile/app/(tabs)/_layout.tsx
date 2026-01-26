import { LAYOUT } from '@team/constants';
import { palette } from '@team/mobile-ui';
import { withAlpha } from '@team/theme';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { fonts } from '@/constants/typography';

const HEADER_HEIGHT = LAYOUT.HEADER_HEIGHT;
const TAB_ICON_SIZE = 28;
const TAB_INACTIVE_TINT = withAlpha(palette.textOnAccent, 0.6);

type TabIconProps = {
  color: string;
  focused: boolean;
  size: number;
};

type IconName = Parameters<typeof IconSymbol>[0]['name'];

const renderTabIcon =
  (name: IconName) =>
  ({ color }: TabIconProps) => {
    return (
      <View>
        <IconSymbol size={TAB_ICON_SIZE} name={name} color={color} />
      </View>
    );
  };

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
            tabBarInactiveTintColor: TAB_INACTIVE_TINT,
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
              tabBarIcon: renderTabIcon('house.fill'),
            }}
          />
          <Tabs.Screen
            name='search'
            options={{
              title: '検索',
              tabBarIcon: renderTabIcon('magnifyingglass'),
            }}
          />
          <Tabs.Screen
            name='favorites'
            options={{
              title: 'お気に入り',
              tabBarIcon: renderTabIcon('heart.fill'),
            }}
          />
          <Tabs.Screen
            name='mypage'
            options={{
              title: 'マイページ',
              tabBarIcon: renderTabIcon('person.crop.circle'),
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
