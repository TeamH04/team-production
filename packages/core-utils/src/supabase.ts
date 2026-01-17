import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';

/**
 * Storage adapter interface for Supabase auth persistence.
 * This abstracts the storage mechanism to support different platforms:
 * - React Native: AsyncStorage
 * - Web: localStorage
 * - Node.js: custom implementation
 */
export interface SupabaseStorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

/**
 * Configuration for creating a Supabase client.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  storage?: SupabaseStorageAdapter;
  /**
   * Additional options to pass to the Supabase client.
   * These will be merged with the default auth options.
   */
  additionalOptions?: Partial<SupabaseClientOptions<'public'>>;
}

/**
 * Default auth options for Supabase client.
 * These are common settings that work across platforms.
 */
export const DEFAULT_SUPABASE_AUTH_OPTIONS = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce' as const,
};

/**
 * Creates a Supabase client with platform-agnostic configuration.
 *
 * @param config - The configuration for the Supabase client
 * @returns A configured SupabaseClient instance
 *
 * @example
 * // React Native usage
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const client = createSupabaseClient({
 *   url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
 *   anonKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
 *   storage: AsyncStorage,
 * });
 *
 * @example
 * // Web usage
 * const client = createSupabaseClient({
 *   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   storage: localStorage,
 * });
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  const { url, anonKey, storage, additionalOptions } = config;

  return createClient(url, anonKey, {
    ...additionalOptions,
    auth: {
      ...DEFAULT_SUPABASE_AUTH_OPTIONS,
      ...(storage && { storage }),
      ...additionalOptions?.auth,
    },
  });
}

/**
 * Checks if Supabase environment variables are configured.
 *
 * @param url - The Supabase URL (can be undefined)
 * @param anonKey - The Supabase anonymous key (can be undefined)
 * @returns true if both url and anonKey are truthy strings
 */
export function isSupabaseConfigured(
  url: string | undefined,
  anonKey: string | undefined,
): boolean {
  return Boolean(url && anonKey);
}
