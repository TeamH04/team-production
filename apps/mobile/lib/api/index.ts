import { createConfiguredApiClient } from '@team/api';

import { ENV } from '../config';

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
  baseUrl: ENV.API_BASE_URL,
});
