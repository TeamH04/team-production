import { createAuthClient } from '@team/auth-client';

import { api } from '../api';

import { getSupabase, isSupabaseConfigured } from './supabase';

// Re-export supabase utilities for convenience
export { getSupabase, isSupabaseConfigured } from './supabase';

// Note: useNavigateAfterLogin is NOT re-exported here to avoid expo-router dependency in tests.
// Import directly from './navigation' when needed in app code.

// Create auth client with mobile-specific configuration
const authClient = createAuthClient({
  getSupabase,
  isSupabaseConfigured,
  fetchAuthMe: token => api.fetchAuthMe(token),
});

// Re-export auth client methods
export const getCurrentUser = authClient.getCurrentUser;
export const getAccessToken = authClient.getAccessToken;
export const checkIsOwner = authClient.checkIsOwner;
export const ensureUserExistsInDB = authClient.ensureUserExistsInDB;
export const resolveAuth = authClient.resolveAuth;
export const hasOwnerRole = authClient.hasOwnerRole;

// Re-export types
export type { OwnerCheck } from '@team/core-utils';
