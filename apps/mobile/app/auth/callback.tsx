import { AUTH_ERROR_MESSAGES, ROUTES, SESSION_NOT_FOUND } from '@team/constants';
import { extractErrorMessage } from '@team/core-utils';
import * as Linking from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { checkIsOwner, ensureUserExistsInDB, getSupabase } from '@/lib/auth';
import { useNavigateAfterLogin } from '@/lib/auth/navigation';

export default function OAuthCallback() {
  const router = useRouter();
  const { navigateAfterLogin } = useNavigateAfterLogin();
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>('pending');

  useEffect(() => {
    const complete = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          setStatus('error');
          return;
        }
        const u = new URL(url);
        const search = new URLSearchParams(u.search);
        const hash = new URLSearchParams(u.hash.startsWith('#') ? u.hash.slice(1) : u.hash);
        const code = search.get('code') || hash.get('code');
        if (code) {
          const { error } = await getSupabase().auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        try {
          await ensureUserExistsInDB();
        } catch (err) {
          const raw = extractErrorMessage(err, 'ログイン処理に失敗しました');
          const message =
            raw === SESSION_NOT_FOUND
              ? 'セッションを取得できませんでした。もう一度ログインしてください。'
              : raw;
          Alert.alert('ログイン失敗', message);
          setStatus('error');
          router.replace(ROUTES.LOGIN as Href);
          return;
        }

        setStatus('done');
        const { isOwner } = await checkIsOwner();
        navigateAfterLogin(isOwner);
      } catch (e: unknown) {
        setStatus('error');
        const message = e instanceof Error ? e.message : 'サインイン処理に失敗しました';
        Alert.alert(AUTH_ERROR_MESSAGES.AUTH_ERROR_TITLE, message);
      }
    };
    complete();
  }, [router, navigateAfterLogin]);

  return (
    <View style={styles.container}>
      {status === 'pending' ? (
        <>
          <ActivityIndicator />
          <Text style={styles.text}>サインイン処理を完了しています…</Text>
        </>
      ) : status === 'done' ? (
        <Text style={styles.text}>完了しました。トップへ移動します。</Text>
      ) : (
        <Text style={styles.text}>エラーが発生しました。アプリに戻ってやり直してください。</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  text: { marginTop: 12 },
});
