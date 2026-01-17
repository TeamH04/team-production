import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createSupabaseClient,
  isSupabaseConfigured as isSupabaseConfiguredCore,
} from '@team/core-utils';

import type { SupabaseClient } from '@supabase/supabase-js';

// Environment variables must be provided via Expo's EXPO_PUBLIC_* mechanism.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY before starting Expo.',
      );
    }
    client = createSupabaseClient({
      url: supabaseUrl,
      anonKey: supabasePublishableKey,
      storage: AsyncStorage,
    });
  }
  return client;
}

export function isSupabaseConfigured() {
  return isSupabaseConfiguredCore(supabaseUrl, supabasePublishableKey);
}
