import { palette } from '@/constants/palette';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ページが見つかりません</Text>
      <Text style={styles.message}>お探しのページは存在しません</Text>
      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>ホームに戻る</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    color: palette.secondaryText,
    fontSize: 16,
    marginTop: 8,
  },
  title: {
    color: palette.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
});
