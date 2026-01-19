import {
  BORDER_RADIUS,
  formatDateInput,
  isValidDateYYYYMMDD,
  isValidEmail,
  LAYOUT,
  PASSWORD_MIN_LENGTH,
  ROUTES,
  SHADOW_STYLES,
  TIMING,
  UI_LABELS,
  VALIDATION_MESSAGES,
} from '@team/constants';
import { palette } from '@team/mobile-ui';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fonts } from '@/constants/typography';

export default function OwnerSignupScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [storeName, setStoreName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [openingDateInvalid, setOpeningDateInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDateChange = (text: string) => {
    const prev = openingDate;
    const isDeleting = text.length < prev.length;
    const next = isDeleting ? text.replace(/[^0-9-]/g, '') : formatDateInput(text);
    setOpeningDate(next);

    const digits = next.replace(/\D/g, '');
    if (digits.length === 8) {
      setOpeningDateInvalid(!isValidDateYYYYMMDD(digits));
    } else {
      setOpeningDateInvalid(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'オーナー新規作成',
      headerBackTitle: UI_LABELS.BACK,
    });
  }, [navigation]);

  const onSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!storeName || !contactName || !trimmedEmail || !password) {
      Alert.alert(
        VALIDATION_MESSAGES.INPUT_MISSING_TITLE,
        '必須項目（店舗名/担当者名/メール/パスワード）を入力してください',
      );
      return;
    }
    // 完成形（数字8桁）のみ検証
    const digits = openingDate.replace(/\D/g, '');
    if (!isValidDateYYYYMMDD(digits)) {
      Alert.alert(VALIDATION_MESSAGES.INPUT_ERROR_TITLE, '正しい日付で入力してください');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert(VALIDATION_MESSAGES.INPUT_ERROR_TITLE, '正式なメールアドレスを入力してください');
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      Alert.alert(VALIDATION_MESSAGES.INPUT_ERROR_TITLE, 'パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setSubmitting(true);
      // NOTE: Backend 未実装。将来的にここで API に POST する想定。
      await new Promise(r => setTimeout(r, TIMING.MOCK_SUBMIT_DELAY));
      Alert.alert('作成完了', 'オーナー用アカウントの申請を受け付けました');
      router.replace(ROUTES.HOME);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '送信に失敗しました';
      Alert.alert('作成失敗', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={16}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>オーナー用アカウント作成</Text>
        <Text style={styles.subtitle}>必要事項を入力してください</Text>

        <View style={styles.form}>
          <Text style={styles.label}>店舗名（必須）</Text>
          <TextInput
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder='例）喫茶サンプル'
            placeholderTextColor={palette.secondaryText}
          />

          <Text style={styles.label}>担当者名（必須）</Text>
          <TextInput
            style={styles.input}
            value={contactName}
            onChangeText={setContactName}
            placeholder='例）山田 太郎'
            placeholderTextColor={palette.secondaryText}
          />

          <Text style={styles.label}>開店日（必須）</Text>
          <TextInput
            style={styles.input}
            value={openingDate}
            onChangeText={handleDateChange}
            keyboardType='numeric'
            placeholder='YYYYMMDD (例: 20240115)'
            placeholderTextColor={palette.secondaryText}
            maxLength={10}
          />
          {openingDateInvalid && (
            <Text style={styles.errorText}>※ 正しい日付で入力してください</Text>
          )}

          <Text style={styles.label}>メールアドレス（必須）</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            inputMode='email'
            autoCapitalize='none'
            placeholder='owner@example.com'
            placeholderTextColor={palette.secondaryText}
          />

          <Text style={styles.label}>パスワード（必須）</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize='none'
            placeholder='8文字以上'
            placeholderTextColor={palette.secondaryText}
          />

          <Text style={styles.label}>電話番号（任意）</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            inputMode='tel'
            autoCapitalize='none'
            placeholder='090-1234-5678'
            placeholderTextColor={palette.secondaryText}
          />
        </View>

        <View style={styles.buttonWrapper}>
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.buttonPressable,
                (pressed || submitting) && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.buttonText}>{submitting ? '作成中…' : '作成する'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    ...SHADOW_STYLES.DEFAULT,
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    height: LAYOUT.BUTTON_HEIGHT_MD,
    minWidth: 160,
    overflow: 'hidden',
  },
  buttonPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: palette.surface,
    fontFamily: fonts.medium,
    fontSize: 16,
    height: LAYOUT.BUTTON_HEIGHT_MD,
    lineHeight: LAYOUT.BUTTON_HEIGHT_MD,
    textAlign: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 24,
  },
  errorText: {
    color: palette.dangerBorder,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    color: palette.primaryText,
    fontFamily: fonts.regular,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 10,
  },
  screen: {
    backgroundColor: palette.background,
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  subtitle: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 24,
  },
});
