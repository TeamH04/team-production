import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter, type Href } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
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

export default function OwnerLoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { signInWithGoogle, signInWithApple, loading: socialLoading } = useSocialAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'オーナーログイン',
      headerBackTitle: 'ログイン',
    });
  }, [navigation]);

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert('入力不足', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      // TODO: 実際の認証処理を実装
      // ここでは仮の認証チェック（将来的にSupabaseなどのAPIに置き換え）
      await new Promise(r => setTimeout(r, 500));

      // 仮の認証失敗シミュレーション（実装時は実際のAPI結果で判定）
      const isAuthSuccess = false; // 実際はAPIレスポンスで判定

      if (!isAuthSuccess) {
        Alert.alert(
          'ログイン失敗',
          'メールアドレスまたはパスワードが正しくありません。再度入力してください。'
        );
        return;
      }

      router.replace('/owner' as Href);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      Alert.alert('ログイン成功', `${result.user?.email} でログインしました`);
      router.replace('/owner' as Href);
    } else {
      Alert.alert('ログイン失敗', result.error || 'Google ログインに失敗しました');
    }
  };

  const handleAppleSignIn = async () => {
    const result = await signInWithApple();
    if (result.success) {
      Alert.alert('ログイン成功', `${result.user?.email} でログインしました`);
      router.replace('/owner' as Href);
    } else {
      Alert.alert('ログイン失敗', result.error || 'Apple ログインに失敗しました');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>オーナーログイン</Text>
              <Ionicons
                name='person-circle'
                size={20}
                color={palette.primaryText}
                style={styles.icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                autoCorrect={false}
                keyboardType='email-address'
                placeholder='owner@example.com'
                placeholderTextColor={palette.tertiaryText}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder='••••••••'
                placeholderTextColor={palette.tertiaryText}
                style={styles.input}
              />
            </View>

            {/* ソーシャルログインセクション */}
            <View style={styles.socialButtonsContainer}>
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={socialLoading || loading}
                style={({ pressed }) => [
                  styles.button,
                  styles.socialButtonOutline,
                  pressed && styles.buttonPressed,
                  (socialLoading || loading) && styles.buttonLoading,
                ]}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name='logo-google' size={20} color={palette.outline} />
                  <Text style={styles.buttonOutlineText}>
                    {socialLoading ? 'Google で処理中…' : 'Google で続行'}
                  </Text>
                </View>
              </Pressable>

              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={handleAppleSignIn}
                  disabled={socialLoading || loading}
                  style={({ pressed }) => [
                    styles.button,
                    styles.socialButtonOutline,
                    pressed && styles.buttonPressed,
                    (socialLoading || loading) && styles.buttonLoading,
                  ]}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name='logo-apple'
                      size={20}
                      color={palette.outline}
                      style={styles.appleIconAdjust}
                    />
                    <Text style={styles.buttonOutlineText}>
                      {socialLoading ? 'Apple で処理中…' : 'Apple で続行'}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            <View style={styles.loginButtonWrapper}>
              <View style={styles.loginButtonContainer}>
                <Pressable
                  onPress={handleLogin}
                  disabled={loading || socialLoading}
                  style={({ pressed }) => [
                    styles.loginButtonPressable,
                    (pressed || loading || socialLoading) && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.loginButtonText}>{loading ? 'ログイン中…' : 'ログイン'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <Pressable
              onPress={() => router.push('/owner/signup' as Href)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.secondaryBtnText}>アカウントを新規作成</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appleIconAdjust: {
    marginTop: 2,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: palette.action,
    borderRadius: 12,
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 48,
    paddingVertical: 12,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  buttonLoading: { opacity: 0.75 },
  buttonOutlineText: {
    color: palette.outline,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: { opacity: 0.9 },
  card: {
    alignSelf: 'stretch',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
  },
  cardShadow: {
    alignSelf: 'center',
    elevation: 5,
    marginHorizontal: 24,
    marginVertical: 28,
    maxWidth: 480,
    shadowColor: palette.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: '100%',
  },
  dividerLine: {
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    height: 1,
    marginVertical: 16,
  },
  icon: { marginLeft: 8 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputGroup: { marginBottom: 14 },
  label: { color: palette.secondaryText, fontSize: 12, marginBottom: 6 },
  loginButtonContainer: {
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
  loginButtonPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '700',
    height: 44,
    includeFontPadding: false,
    lineHeight: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  loginButtonWrapper: {
    alignItems: 'center',
    marginTop: 24,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  secondaryBtn: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: palette.link, fontWeight: '700', textAlign: 'center' },
  socialButtonOutline: {
    backgroundColor: palette.surface,
    borderColor: palette.outline,
    borderWidth: 1,
  },
  socialButtonsContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    gap: 12,
    marginTop: 4,
  },
  title: { color: palette.primaryText, fontSize: 20, fontWeight: '800' },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
