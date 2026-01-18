import { createConfiguredApiClient } from '@team/api';

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
} from '@team/api';

export const api = createConfiguredApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
});
