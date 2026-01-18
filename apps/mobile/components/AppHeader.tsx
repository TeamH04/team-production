import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { palette } from '@/constants/palette';

export function AppHeader() {
  return (
    <View style={styles.container}>
      <StatusBar style='light' backgroundColor={palette.accent} />
      <View style={styles.logoContainer}>
        <KuguriTitle
          width={120}
          height={32}
          preserveAspectRatio='xMidYMid meet'
          accessibilityLabel='Kuguriロゴ'
          fill={palette.textOnAccent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
