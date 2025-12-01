import { Redirect, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { checkIsOwner } from '@/lib/auth';

export default function Entry() {
  const [dest, setDest] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const { isOwner, user } = await checkIsOwner();
        if (user) {
          setDest(isOwner ? '/owner' : '/(tabs)');
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
