import { ROUTES } from '@team/constants';
import { palette } from '@team/mobile-ui';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { checkIsOwner } from '@/lib/auth';

export default function OwnerHomeScreen() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      const { isOwner } = await checkIsOwner();
      if (!isOwner) {
        setAuthorized(false);
        Alert.alert('アクセス権がありません', 'オーナーとしてログインしてください');
      } else {
        setAuthorized(true);
      }
    };
    run();
  }, []);

  if (authorized === null) {
    return (
      <View style={styles.center}>
        <Text>読み込み中…</Text>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Pressable style={styles.linkBtn} onPress={() => router.replace(ROUTES.LOGIN as Href)}>
          <Text style={styles.linkText}>ログインへ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>オーナーホーム</Text>
      <Text style={styles.subtitle}>店舗の情報管理やレビュー確認などを行えます。</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>クイックアクション</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => router.push(ROUTES.HOME)}>
            <Text style={styles.actionText}>ユーザーホームへ</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => Alert.alert('未実装', '店舗編集は今後実装予定です')}
          >
            <Text style={styles.actionText}>店舗を編集</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    backgroundColor: palette.secondarySurface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionText: { color: palette.textOnSecondary, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    color: palette.primaryText,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  linkBtn: {
    backgroundColor: palette.secondarySurface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  linkText: { color: palette.textOnSecondary, fontWeight: '700' },
  screen: {
    backgroundColor: palette.background,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  subtitle: { color: palette.secondaryText, marginBottom: 20, marginTop: 8 },
  title: { color: palette.primaryText, fontSize: 24, fontWeight: '700' },
});
