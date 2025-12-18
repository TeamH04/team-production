import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
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

import { palette } from '@/constants/palette';

const isLikelyEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');

  const limitedDigits = digits.slice(0, 8);

  if (limitedDigits.length < 4) {
    return limitedDigits;
  } else if (limitedDigits.length === 4) {
    return `${limitedDigits}-`;
  } else if (limitedDigits.length < 6) {
    return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}`;
  } else if (limitedDigits.length === 6) {
    return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}-`;
  } else {
    return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4, 6)}-${limitedDigits.slice(6)}`;
  }
};

const isInvalidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  if (dateString.length > 10) return true;

  const parts = dateString.split('-');
  if (parts.length > 3) return true;

  const [yearStr = '', monthStr, dayStr] = parts;

  if (yearStr && yearStr.length > 4) return true;

  if (monthStr !== undefined) {
    if (monthStr.length > 2) return true;
    const m = parseInt(monthStr, 10);
    if (!Number.isNaN(m)) {
      if (m < 1 || m > 12) return true;
    }
  }

  if (dayStr !== undefined) {
    if (dayStr.length > 2) return true;
    const d = parseInt(dayStr, 10);
    if (!Number.isNaN(d)) {
      if (d < 1 || d > 31) return true;
    }
  }

  if (dateString.length === 10 && parts.length === 3) {
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr ?? '', 10);
    const d = parseInt(dayStr ?? '', 10);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return true;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return true;
    }
  }

  return false;
};

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
    const prevText = openingDate;
    const isDeleting = text.length < prevText.length;
    const nextValue = isDeleting ? text.replace(/[^0-9-]/g, '') : formatDateInput(text);
    setOpeningDate(nextValue);
    setOpeningDateInvalid(isInvalidDate(nextValue));
  };

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'オーナー新規作成',
      headerBackTitle: '戻る',
    });
  }, [navigation]);

  const onSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!storeName || !contactName || !trimmedEmail || !password) {
      Alert.alert('入力不足', '必須項目（店舗名/担当者名/メール/パスワード）を入力してください');
      return;
    }
    if (!openingDate || openingDate.length !== 10 || isInvalidDate(openingDate)) {
      Alert.alert('入力エラー', '正しい日付で入力してください');
      return;
    }

    if (!isLikelyEmail(trimmedEmail)) {
      Alert.alert('入力エラー', '正式なメールアドレスを入力してください');
      return;
    }

    if (password.length < 8) {
      Alert.alert('入力エラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setSubmitting(true);
      // NOTE: Backend 未実装。将来的にここで API に POST する想定。
      await new Promise(r => setTimeout(r, 600));
      Alert.alert('作成完了', 'オーナー用アカウントの申請を受け付けました');
      router.replace('/');
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
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 4,
    height: 44,
    minWidth: 160,
    overflow: 'hidden',
    shadowColor: palette.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  buttonPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 32,
  },
  errorText: {
    color: palette.dangerBorder,
    fontSize: 12,
    marginTop: 4,
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primaryText,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: palette.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
});
