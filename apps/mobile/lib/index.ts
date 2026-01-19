// Re-exports for backward compatibility
// New code should import from the specific module directories

// Config exports
export { ENV } from './config';

// API exports
export { api } from './api';
export type {
  ApiFavorite,
  ApiFile,
  ApiMenu,
  ApiReview,
  ApiStore,
  ApiUser,
  ReviewSort,
  SignedUploadFile,
  UploadFileInput,
} from './api';

// Auth exports
export {
  checkIsOwner,
  ensureUserExistsInDB,
  getAccessToken,
  getCurrentUser,
  getSupabase,
  hasOwnerRole,
  isSupabaseConfigured,
  resolveAuth,
} from './auth';
export type { OwnerCheck } from './auth';

// Storage exports
export { storage } from './storage';
