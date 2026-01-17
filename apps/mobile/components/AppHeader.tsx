import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { palette } from '@/constants/palette';

export function AppHeader() {
  return (
    <View style={styles.container}>
      <StatusBar style='light' backgroundColor={palette.accent} />
      <KuguriTitle
        width='64%'
        height='100%'
        preserveAspectRatio='xMidYMid meet'
        accessibilityLabel='Kuguriロゴ'
        fill={palette.textOnAccent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    paddingVertical: 14,
  },
});
