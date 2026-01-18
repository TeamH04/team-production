import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GENRES, toggleGenre as toggleGenreUtil } from '@/constants/genres';
import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { fonts } from '@/constants/typography';
import { type Gender, useUser } from '@/features/user/UserContext';

const modalOverlayOpacity = 0.3;

// プロフィール編集画面コンポーネント
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();

  // ローカルなフォーム state（表示名・メールアドレス）
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const [birthYear, setBirthYear] = useState<string>(user?.birthYear ?? '');
  const [birthMonth, setBirthMonth] = useState<string>(user?.birthMonth ?? '');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user?.favoriteGenres ?? []);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorName, setErrorName] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorBirth, setErrorBirth] = useState('');
  const [saveError, setSaveError] = useState('');

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const arr: string[] = [];
    for (let y = current; y >= 1900; y--) arr.push(String(y));
    return arr;
  }, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const canSave = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && !saving;
  }, [email, name, saving]);

  /** ジャンルの選択状態をトグルする */
  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => toggleGenreUtil(prev, genre));
  };

  const validateForm = (): boolean => {
    setErrorName('');
    setErrorEmail('');
    setErrorBirth('');
    setSaveError('');

    if (name.trim().length <= 0) {
      setErrorName('※表示名の入力は必須です');
      return false;
    }

    if (email.trim().length <= 0) {
      setErrorEmail('※メールアドレスの入力は必須です');
      return false;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setErrorEmail('※有効なメールアドレスを入力してください');
      return false;
    }

    // 生年月日は任意だが、入力する場合は年と月の両方が必要
    if (!!birthYear !== !!birthMonth) {
      setErrorBirth('※生年月日は年と月の両方を選択してください');
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!user) {
      throw new Error('user is null');
    }

    // 将来的に API 呼び出しに置き換え可能
    await Promise.resolve();

    setUser({
      ...user,
      name: name.trim(),
      email: email.trim(),
      gender: gender || undefined,
      birthYear: birthYear || undefined,
      birthMonth: birthMonth || undefined,
      isProfileRegistered: true,
      favoriteGenres,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboard}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {/* タイトル */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>プロフィール編集</Text>
        </View>

        {/* アバター（表示名の先頭2文字を表示） */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name || 'U').slice(0, 2).toUpperCase()}</Text>
        </View>

        {/* フォームカード */}
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            {/* 表示名入力 */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>表示名（必須）</Text>
                <Text style={styles.errorText}>{errorName}</Text>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder='例: Hanako Tanaka'
                placeholderTextColor={palette.mutedText}
                style={styles.input}
                autoCapitalize='words'
              />
            </View>

            {/* メールアドレス入力 */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>メールアドレス（必須）</Text>
                <Text style={styles.errorText}>{errorEmail}</Text>
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder='example@domain.com'
                placeholderTextColor={palette.mutedText}
                style={styles.input}
                autoCapitalize='none'
                keyboardType='email-address'
              />
            </View>
          </View>
        </View>

        <View style={styles.cardShadow}>
          <View style={styles.card}>
            {/* 性別ラジオボタン */}
            <Text style={styles.label}>性別（任意） </Text>
            <View style={styles.radioGroup}>
              <Pressable
                onPress={() => setGender('male')}
                style={styles.radioOption}
                accessibilityRole='radio'
                accessibilityState={{ selected: gender === 'male' }}
              >
                <View
                  style={[styles.radioCircle, gender === 'male' && styles.radioCircleSelected]}
                />
                <Text style={styles.radioOptionText}>男</Text>
              </Pressable>

              <Pressable
                onPress={() => setGender('female')}
                style={styles.radioOption}
                accessibilityRole='radio'
                accessibilityState={{ selected: gender === 'female' }}
              >
                <View
                  style={[styles.radioCircle, gender === 'female' && styles.radioCircleSelected]}
                />
                <Text style={styles.radioOptionText}>女</Text>
              </Pressable>

              <Pressable
                onPress={() => setGender('other')}
                style={styles.radioOption}
                accessibilityRole='radio'
                accessibilityState={{ selected: gender === 'other' }}
              >
                <View
                  style={[styles.radioCircle, gender === 'other' && styles.radioCircleSelected]}
                />
                <Text style={styles.radioOptionText}>その他</Text>
              </Pressable>
            </View>

            {/* 生年月日（西暦・月） */}
            <View style={styles.labelContainer}>
              <Text style={styles.label}>生年月日（任意） </Text>
              <Text style={styles.errorText}>{errorBirth}</Text>
            </View>
            <View style={styles.dobRow}>
              <View style={styles.pickerContainer}>
                <Pressable
                  style={styles.pickerBox}
                  onPress={() => setShowYearPicker(true)}
                  accessibilityRole='button'
                  accessibilityLabel='生年月日の年を選択'
                >
                  <Text style={birthYear ? styles.pickerText : styles.pickerUnselectedText}>
                    {birthYear ? `${birthYear}年` : '年を選択'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.pickerContainer}>
                <Pressable
                  style={styles.pickerBox}
                  onPress={() => setShowMonthPicker(true)}
                  accessibilityRole='button'
                  accessibilityLabel='生年月日の月を選択'
                >
                  <Text style={birthMonth ? styles.pickerText : styles.pickerUnselectedText}>
                    {birthMonth ? `${birthMonth}月` : '月を選択'}
                  </Text>
                </Pressable>
              </View>

              <Modal
                visible={showYearPicker}
                transparent
                animationType='slide'
                onRequestClose={() => setShowYearPicker(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setShowYearPicker(false)} />
                <View style={styles.modalContent}>
                  <View style={styles.modalToolbar}>
                    <Pressable onPress={() => setShowYearPicker(false)}>
                      <Text style={styles.modalDoneText}>完了</Text>
                    </Pressable>
                  </View>
                  <Picker
                    selectedValue={birthYear}
                    onValueChange={(v: string) => setBirthYear(String(v))}
                  >
                    <Picker.Item label='年を選択' value='' />
                    {years.map(y => (
                      <Picker.Item key={y} label={`${y}年`} value={y} />
                    ))}
                  </Picker>
                </View>
              </Modal>

              <Modal
                visible={showMonthPicker}
                transparent
                animationType='slide'
                onRequestClose={() => setShowMonthPicker(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setShowMonthPicker(false)} />
                <View style={styles.modalContent}>
                  <View style={styles.modalToolbar}>
                    <Pressable onPress={() => setShowMonthPicker(false)}>
                      <Text style={styles.modalDoneText}>完了</Text>
                    </Pressable>
                  </View>
                  <Picker
                    selectedValue={birthMonth}
                    onValueChange={(v: string) => setBirthMonth(String(v))}
                  >
                    <Picker.Item label='月を選択' value='' />
                    {months.map(m => (
                      <Picker.Item key={m} label={`${m}月`} value={m} />
                    ))}
                  </Picker>
                </View>
              </Modal>
            </View>
          </View>
        </View>

        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <Text style={styles.label}>好きな店舗のジャンル（複数選択可）</Text>
            <View style={styles.chipsWrap}>
              {GENRES.map(g => {
                const on = favoriteGenres.includes(g);
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGenre(g)}
                    style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                  >
                    <Text style={on ? styles.chipTextOn : styles.chipTextOff}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* 保存ボタン
            - disabled 時は押せない
            - 押したら setUser を呼んで前の画面へ戻る */}
        <Text style={styles.errorText}>{saveError}</Text>

        <Pressable
          disabled={!canSave}
          onPress={async () => {
            if (!validateForm()) {
              return;
            }

            setSaving(true);
            try {
              await saveProfile();
            } catch {
              setSaveError('保存に失敗しました。もう一度お試しください。');
            } finally {
              setSaving(false);
            }
          }}
          style={[styles.primaryBtn, !canSave && styles.primaryBtnDisabled]}
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
    backgroundColor: palette.secondarySurface,
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
    width: 88,
  },
  avatarText: { color: palette.primary, fontFamily: fonts.medium, fontSize: 32 },

  // カード背景
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
  },

  // カードシャドウ
  cardShadow: {
    elevation: 4,
    marginBottom: 24,
    marginTop: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },

  // チップ（ジャンル選択）
  chip: {
    borderRadius: 999,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOff: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: palette.accent },

  chipTextOff: { color: palette.primaryText, fontFamily: fonts.medium },

  chipTextOn: { color: palette.primaryOnAccent, fontFamily: fonts.medium },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // コンテンツの余白
  content: {
    gap: 4,
    padding: 16,
    paddingBottom: TAB_BAR_SPACING,
  },

  dobRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },

  errorText: { color: palette.errorText, fontFamily: fonts.regular, marginBottom: 8 },

  // フォームグループ
  formGroup: {
    marginBottom: 16,
  },

  // ヘッダーコンテナ
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // 入力欄のスタイル
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    fontFamily: fonts.regular,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // キーボード回避用コンテナ
  keyboard: { flex: 1 },

  // ラベル（表示名・メールなどの見出し）
  label: { color: palette.primaryText, fontFamily: fonts.medium, marginBottom: 8 },
  labelContainer: { flexDirection: 'row' },

  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalDoneText: { color: palette.accent, fontFamily: fonts.medium },
  modalOverlay: {
    backgroundColor: palette.shadow,
    flex: 1,
    opacity: modalOverlayOpacity,
  },
  modalToolbar: {
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderColor: palette.border,
    padding: 12,
  },

  pickerBox: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '100%',
  },
  pickerContainer: { flex: 1 },
  pickerText: { color: palette.primaryText, fontFamily: fonts.regular },
  pickerUnselectedText: { color: palette.secondaryText, fontFamily: fonts.regular },

  // プライマリボタン（保存）
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  // ラジオボタン
  radioCircle: {
    borderColor: palette.border,
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    marginRight: 8,
    width: 18,
  },
  radioCircleSelected: { backgroundColor: palette.accent, borderWidth: 3.5 },
  radioGroup: { flexDirection: 'row', gap: 12, marginBottom: 22, marginTop: 2 },
  radioOption: { alignItems: 'center', flexDirection: 'row', marginRight: 12 },
  radioOptionText: { color: palette.primaryText, fontFamily: fonts.medium },

  // 画面背景
  screen: { backgroundColor: palette.background, flex: 1 },

  // セカンダリボタン（キャンセル）
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 40,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  // タイトル
  title: {
    color: palette.primary,
    fontFamily: fonts.medium,
    fontSize: 20,
    textAlign: 'center',
  },
});
