import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const palette = {
  surface: '#ffffff',
  background: '#F9FAFB',
  primaryText: '#111827',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  button: '#111827',
};

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
      // NOTE: Backend is not yet defined. This is a stub for future API integration.
      // You can POST to your backend here, e.g., `/api/owners`.
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
    <View style={styles.screen}>
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
          placeholder='owner@example.com'
          placeholderTextColor={palette.secondaryText}
        />

        <Text style={styles.label}>電話番号（任意）</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          inputMode='tel'
          placeholder='090-1234-5678'
          placeholderTextColor={palette.secondaryText}
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={submitting}
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.9 },
          submitting && { opacity: 0.7 },
        ]}
      >
        <Text style={styles.buttonText}>{submitting ? '作成中…' : '作成する'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: palette.button,
    borderRadius: 12,
    marginTop: 24,
    paddingVertical: 14,
  },
  buttonText: { color: palette.surface, fontSize: 16, fontWeight: '700' },
  form: { gap: 8 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primaryText,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: { color: palette.primaryText, fontSize: 14, marginTop: 10 },
  screen: { backgroundColor: palette.background, flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  subtitle: { color: palette.secondaryText, marginBottom: 16, marginTop: 8 },
  title: { color: palette.primaryText, fontSize: 24, fontWeight: '700' },
});
