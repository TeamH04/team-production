import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Href, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { checkIsOwner, ensureUserExistsInDB } from '@/lib/auth';
import { DEV_GUEST_FLAG_KEY, DEV_LOGIN_ENABLED } from '@/lib/devMode';

export default function Entry() {
  const [dest, setDest] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (DEV_LOGIN_ENABLED) {
          const guestFlag = await AsyncStorage.getItem(DEV_GUEST_FLAG_KEY);
          if (guestFlag === 'true') {
            setDest('/(tabs)');
            return;
          }
        } else {
          await AsyncStorage.removeItem(DEV_GUEST_FLAG_KEY);
        }

        const { isOwner, user } = await checkIsOwner();
        if (user) {
          try {
            await ensureUserExistsInDB();
            setDest(isOwner ? '/owner' : '/(tabs)');
          } catch {
            setDest('/login');
          }
        } else {
          setDest('/login');
        }
      } catch (error) {
        console.error('[Entry] Failed to check auth status:', error);
        setDest('/login');
      }
    };
    run();
  }, []);

  if (!dest) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={dest as Href} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
