import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
      edges={['top', 'left', 'right']}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
          }}
        />
        <Tabs.Screen
          name='explore'
          options={{
            title: 'さがす',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='paperplane.fill' color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
