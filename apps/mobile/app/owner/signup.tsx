import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function OwnerSignupScreen() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!storeName || !contactName || !email) {
      Alert.alert('入力不足', '必須項目（店舗名/担当者名/メール）を入力してください');
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
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
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
    color: palette.textOnSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 32,
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
