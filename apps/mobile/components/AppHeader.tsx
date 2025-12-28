import HeroTitle from '@/assets/icons/kaguri.svg';
import { palette } from '@/constants/palette';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

export function AppHeader() {
  return (
    <View style={styles.container}>
      <StatusBar style='light' backgroundColor={palette.accent} />
      <HeroTitle
        width='64%'
        height='100%'
        preserveAspectRatio='xMidYMid meet'
        accessibilityLabel='Kuguriロゴ'
        // 色を白いロゴにする
        fill={palette.primaryOnAccent}
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
