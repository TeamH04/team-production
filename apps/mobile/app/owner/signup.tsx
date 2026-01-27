import {
  BORDER_RADIUS,
  ERROR_MESSAGES,
  formatDateInput,
  isValidDateYYYYMMDD,
  isValidEmail,
  LAYOUT,
  PASSWORD_MIN_LENGTH,
  ROUTES,
  SHADOW_STYLES,
  UI_LABELS,
  VALIDATION_MESSAGES,
} from '@team/constants';
import { palette } from '@team/mobile-ui';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
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
import { api } from '@/lib/api';
import { getAccessToken, getSupabase, isSupabaseConfigured } from '@/lib/auth';

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
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [lastOtpSentAt, setLastOtpSentAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

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

  useEffect(() => {
    if (step !== 'otp') return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  const resendCooldownSeconds = useMemo(() => {
    if (!lastOtpSentAt) return 0;
    const elapsed = Math.floor((nowTick - lastOtpSentAt) / 1000);
    return Math.max(0, 60 - elapsed);
  }, [lastOtpSentAt, nowTick]);

  const canResend = resendCooldownSeconds === 0 && !otpSending;

  const onSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!storeName || !contactName || !trimmedEmail || !password || !openingDate) {
      Alert.alert(
        VALIDATION_MESSAGES.INPUT_MISSING_TITLE,
        '必須項目（店舗名/担当者名/メール/パスワード/開店日）を入力してください',
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

    if (!isSupabaseConfigured()) {
      Alert.alert('未設定', ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
      return;
    }

    try {
      setOtpSending(true);
      const { error } = await getSupabase().auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: true },
      });
      if (error) {
        throw error;
      }
      setLastOtpSentAt(Date.now());
      setStep('otp');
      Alert.alert('送信完了', 'ワンタイムパスコードをメールで送信しました');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '送信に失敗しました';
      Alert.alert('送信失敗', message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerify = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    if (!otpCode.trim()) {
      Alert.alert(VALIDATION_MESSAGES.INPUT_ERROR_TITLE, 'ワンタイムパスコードを入力してください');
      return;
    }

    try {
      setOtpVerifying(true);
      const { error: verifyError } = await getSupabase().auth.verifyOtp({
        email: trimmedEmail,
        token: otpCode.trim(),
        type: 'email',
      });
      if (verifyError) {
        throw verifyError;
      }

      const { error: updateError } = await getSupabase().auth.updateUser({
        password,
      });
      if (updateError) {
        const message = updateError.message?.toLowerCase() ?? '';
        const isSamePasswordError = message.includes(
          'new password should be different from the old password',
        );
        if (!isSamePasswordError) {
          throw updateError;
        }
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('セッションを取得できませんでした。もう一度お試しください。');
      }
      await api.completeOwnerSignup(
        {
          contact_name: contactName,
          store_name: storeName,
          opening_date: openingDate.replace(/\D/g, ''),
          phone: trimmedPhone ? trimmedPhone : undefined,
        },
        accessToken,
      );

      Alert.alert('作成完了', 'オーナー用アカウントを作成しました。');
      router.replace(ROUTES.OWNER);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '送信に失敗しました';
      Alert.alert('作成失敗', message, [
        { text: '再試行' },
        {
          text: '入力内容を修正する',
          style: 'cancel',
          onPress: () => {
            setStep('form');
            setOtpCode('');
            setLastOtpSentAt(null);
          },
        },
      ]);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setOtpSending(true);
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        throw error;
      }
      setLastOtpSentAt(Date.now());
      Alert.alert('再送完了', 'ワンタイムパスコードを再送しました');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '再送に失敗しました';
      Alert.alert('再送失敗', message);
    } finally {
      setOtpSending(false);
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
            editable={step === 'form'}
            placeholder='例）喫茶サンプル'
            placeholderTextColor={palette.secondaryText}
          />

          <Text style={styles.label}>担当者名（必須）</Text>
          <TextInput
            style={styles.input}
            value={contactName}
            onChangeText={setContactName}
            editable={step === 'form'}
            placeholder='例）山田 太郎'
            placeholderTextColor={palette.secondaryText}
          />

          <Text style={styles.label}>開店日（必須）</Text>
          <TextInput
            style={styles.input}
            value={openingDate}
            onChangeText={handleDateChange}
            keyboardType='numeric'
            editable={step === 'form'}
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
            editable={step === 'form'}
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
            editable={step === 'form'}
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
            editable={step === 'form'}
            placeholder='090-1234-5678'
            placeholderTextColor={palette.secondaryText}
          />
        </View>

        {step === 'otp' && (
          <View style={styles.otpBox}>
            <Text style={styles.otpTitle}>ワンタイムパスコード</Text>
            <Text style={styles.otpHint}>メールで届いた6桁のコードを入力してください。</Text>
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType='number-pad'
              placeholder='123456'
              placeholderTextColor={palette.secondaryText}
              maxLength={6}
            />

            <View style={styles.otpActions}>
              <Pressable onPress={handleResend} disabled={!canResend} style={styles.resendButton}>
                <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                  {canResend ? 'コードを再送する' : `再送まで${resendCooldownSeconds}秒`}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setStep('form');
                  setOtpCode('');
                  setLastOtpSentAt(null);
                }}
                style={styles.editButton}
              >
                <Text style={styles.editText}>入力内容を修正する</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.buttonWrapper}>
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={step === 'form' ? onSubmit : handleVerify}
              disabled={otpSending || otpVerifying}
              style={({ pressed }) => [
                styles.buttonPressable,
                (pressed || otpSending || otpVerifying) && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.buttonText}>
                {otpSending || otpVerifying
                  ? step === 'form'
                    ? '送信中…'
                    : '確認中…'
                  : step === 'form'
                    ? 'コードを送信'
                    : '認証して作成'}
              </Text>
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
  editButton: {
    alignItems: 'center',
  },
  editText: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 13,
    textDecorationLine: 'underline',
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
  otpActions: {
    gap: 12,
    marginTop: 12,
  },
  otpBox: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  otpHint: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  otpTitle: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  resendButton: {
    alignItems: 'center',
  },
  resendText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  resendTextDisabled: {
    color: palette.tertiaryText,
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
