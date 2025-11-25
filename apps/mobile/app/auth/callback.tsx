import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { getSupabase } from '@/lib/supabase';
import { checkIsOwner } from '@/lib/auth';

export default function OAuthCallback() {
  const router = useRouter();
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
          // @ts-expect-error see login.tsx comment about recent supabase-js versions
          const { error } = await getSupabase().auth.exchangeCodeForSession({ code });
          if (error) throw error;
        }
        setStatus('done');
        // Decide destination explicitly to ensure we land on an app screen
        const { isOwner } = await checkIsOwner();
        router.replace((isOwner ? '/owner' : '/(tabs)') as Href);
      } catch (e: unknown) {
        setStatus('error');
        const message = e instanceof Error ? e.message : 'サインイン処理に失敗しました';
        Alert.alert('認証エラー', message);
      }
    };
    complete();
  }, [router]);

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
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  text: { marginTop: 12 },
});
