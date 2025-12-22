import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/palette';
import { useUser } from '@/features/user/UserContext';

// プロフィール編集画面コンポーネント
export default function EditProfileScreen() {
  // 画面遷移用フック
  const router = useRouter();

  // ユーザー情報取得・更新用のコンテキスト
  const { profile, updateProfile } = useUser();

  // ローカルなフォーム state（入力値を保持）
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  // 保存ボタンを有効にするかの判定（簡易バリデーション）
  const canSave = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email.trim());
    return name.trim().length > 0 && emailOk;
  }, [name, email]);

  // レンダリング
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboard}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {/* アバター（表示名の先頭2文字を表示） */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name || 'U').slice(0, 2).toUpperCase()}</Text>
        </View>

        {/* 表示名入力 */}
        <Text style={styles.label}>表示名</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder='例: Hanako Tanaka'
          placeholderTextColor={palette.muted}
          style={styles.input}
          autoCapitalize='words'
        />

        {/* メールアドレス入力 */}
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder='example@domain.com'
          placeholderTextColor={palette.muted}
          style={styles.input}
          autoCapitalize='none'
          keyboardType='email-address'
        />

        {/* 保存ボタン
            - disabled 時は押せない
            - 押したら updateProfile を呼んで前の画面へ戻る */}
        <Pressable
          disabled={!canSave}
          onPress={() => {
            updateProfile({ name: name.trim(), email: email.trim() });
            router.back();
          }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>保存</Text>
        </Pressable>

        {/* キャンセルボタン（編集を破棄して戻る） */}
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>キャンセル</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// スタイル定義（見た目の調整）
// 各スタイルは用途ごとにコメントを付けています
const styles = StyleSheet.create({
  // Avatar（ユーザーアイコン）
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: palette.avatarBackground,
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    marginBottom: 16,
    width: 88,
  },
  avatarText: { color: palette.avatarText, fontSize: 28, fontWeight: '800' },

  // コンテンツの余白
  content: { padding: 16 },

  // 入力欄のスタイル
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primaryText,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // キーボード回避用コンテナ
  keyboard: { flex: 1 },

  // ラベル（表示名・メールなどの見出し）
  label: { color: palette.primaryText, fontWeight: '700', marginBottom: 8 },

  // プライマリボタン（保存）
  primaryBtn: {
    backgroundColor: palette.button,
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 12,
  },
  primaryBtnText: { color: palette.textOnPrimary, fontWeight: '700', textAlign: 'center' },

  // 画面背景
  screen: { backgroundColor: palette.surface, flex: 1 },

  // セカンダリボタン（キャンセル）
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: { color: palette.textOnSecondary, fontWeight: '700', textAlign: 'center' },
});
