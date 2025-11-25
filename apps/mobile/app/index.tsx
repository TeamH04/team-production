import React, { useEffect, useState } from 'react';
import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

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
      } catch {
        setDest('/login');
      }
    };
    run();
  }, []);

  if (!dest) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={dest as Href} />;
}
