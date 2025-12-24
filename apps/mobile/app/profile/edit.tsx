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

// カラー定義
const paletteSub = {
  avatarBackground: '#DBEAFE',
  avatarText: '#1D4ED8',
};

// プロフィール編集画面コンポーネント
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();

  // ローカルなフォーム state（表示名・メールアドレス）
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 保存ボタンを有効にするかの判定
  const canSave = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email.trim());
    return name.trim().length > 0 && emailOk;
  }, [name, email]);

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
          placeholderTextColor={palette.secondaryText}
          style={styles.input}
          autoCapitalize='words'
        />

        {/* メールアドレス入力 */}
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder='example@domain.com'
          placeholderTextColor={palette.secondaryText}
          style={styles.input}
          autoCapitalize='none'
          keyboardType='email-address'
        />

        {/* 性別ラジオボタン */}
        <Text style={styles.label}>性別</Text>
        <View style={styles.radioGroup}>
          <Pressable
            onPress={() => setGender('male')}
            style={styles.radioOption}
            accessibilityRole='radio'
            accessibilityState={{ selected: gender === 'male' }}
          >
            <View style={[styles.radioCircle, gender === 'male' && styles.radioCircleSelected]} />
            <Text style={styles.radioOptionText}>男</Text>
          </Pressable>

          <Pressable
            onPress={() => setGender('female')}
            style={styles.radioOption}
            accessibilityRole='radio'
            accessibilityState={{ selected: gender === 'female' }}
          >
            <View style={[styles.radioCircle, gender === 'female' && styles.radioCircleSelected]} />
            <Text style={styles.radioOptionText}>女</Text>
          </Pressable>

          <Pressable
            onPress={() => setGender('other')}
            style={styles.radioOption}
            accessibilityRole='radio'
            accessibilityState={{ selected: gender === 'other' }}
          >
            <View style={[styles.radioCircle, gender === 'other' && styles.radioCircleSelected]} />
            <Text style={styles.radioOptionText}>その他</Text>
          </Pressable>
        </View>

        {/* 保存ボタン
            - disabled 時は押せない
            - 押したら updateProfile を呼んで前の画面へ戻る */}
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          disabled={!canSave || saving}
          onPress={async () => {
            // 前バリデーションのリセット
            setError('');

            setSaving(true);
            try {
              // 保存処理（ここは同期の setUser だが、将来的に API 呼び出しに置き換え可能）
              await Promise.resolve();
              setUser({ name: name.trim(), email: email.trim(), gender, isProfileRegistered: true });
              router.back();
            } catch (e) {
              setError('保存に失敗しました。もう一度お試しください。');
            } finally {
              setSaving(false);
            }
          }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>{saving ? '保存中...' : '保存'}</Text>
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
const styles = StyleSheet.create({
  // Avatar
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: paletteSub.avatarBackground,
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    marginBottom: 16,
    width: 88,
  },
  avatarText: { color: paletteSub.avatarText, fontSize: 28, fontWeight: '800' },

  // コンテンツの余白
  content: { padding: 16 },

  errorText: { color: '#DC2626', marginBottom: 8 },
  
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
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 12,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },

  // ラジオボタン
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.border,
    marginRight: 8,
  },
  radioCircleSelected: { backgroundColor: palette.accent, borderWidth: 3.5 },
  radioGroup: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  radioOptionText: { color: palette.primaryText, fontWeight: '600' },

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
  secondaryBtnText: { color: palette.primaryText, fontWeight: '700', textAlign: 'center' },
});
