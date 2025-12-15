import { Ionicons } from '@expo/vector-icons';
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
import { useSocialAuth } from '@/hooks/useSocialAuth';

export default function OwnerSignupScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { signInWithGoogle, signInWithApple, loading: socialLoading } = useSocialAuth();
  const [storeName, setStoreName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'オーナー新規作成',
      headerBackTitle: '戻る',
    });
  }, [navigation]);

  const onSubmit = async () => {
    if (!storeName || !contactName || !email || !password) {
      Alert.alert('入力不足', '必須項目（店舗名/担当者名/メール/パスワード）を入力してください');
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

  const handleGoogleSignup = async () => {
    if (socialLoading || submitting) return;

    const result = await signInWithGoogle();
    if (result.success) {
      Alert.alert('作成完了', `${result.user?.email ?? 'Googleアカウント'} で作成しました`);
      router.replace('/owner');
    } else {
      Alert.alert('作成失敗', result.error ?? 'Google での作成に失敗しました');
    }
  };

  const handleAppleSignup = async () => {
    if (socialLoading || submitting) return;

    const result = await signInWithApple();
    if (result.success) {
      Alert.alert('作成完了', `${result.user?.email ?? 'Appleアカウント'} で作成しました`);
      router.replace('/owner');
    } else {
      Alert.alert('作成失敗', result.error ?? 'Apple での作成に失敗しました');
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

        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <Pressable
              onPress={handleGoogleSignup}
              disabled={socialLoading || submitting}
              style={({ pressed }) => [
                styles.socialButton,
                (pressed || socialLoading || submitting) && { opacity: 0.8 },
              ]}
            >
              <View style={styles.socialButtonContent}>
                <Ionicons name='logo-google' size={20} color={palette.outline} />
                <Text style={styles.socialButtonText}>
                  {socialLoading ? 'Google で処理中…' : 'Google で作成'}
                </Text>
              </View>
            </Pressable>

            {Platform.OS === 'ios' && (
              <Pressable
                onPress={handleAppleSignup}
                disabled={socialLoading || submitting}
                style={({ pressed }) => [
                  styles.socialButton,
                  (pressed || socialLoading || submitting) && { opacity: 0.8 },
                ]}
              >
                <View style={styles.socialButtonContent}>
                  <Ionicons
                    name='logo-apple'
                    size={20}
                    color={palette.outline}
                    style={styles.appleIconAdjust}
                  />
                  <Text style={styles.socialButtonText}>
                    {socialLoading ? 'Apple で処理中…' : 'Apple で作成'}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  appleIconAdjust: {
    marginTop: 2,
  },
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
  dividerLine: {
    backgroundColor: palette.border,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dividerText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '600',
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
  socialButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.outline,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  socialButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  socialButtonText: {
    color: palette.outline,
    fontSize: 15,
    fontWeight: '700',
  },
  socialButtonsContainer: {
    gap: 12,
  },
  socialSection: {
    marginTop: 28,
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
