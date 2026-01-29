import { describe, expect, test } from 'vitest';

import { getAccessToken, getCurrentUserId, isAuthenticated, withAuth } from '../auth';

describe('auth', () => {
  describe('getAccessToken', () => {
    test('認証トークンが未設定の場合はnullを返す', async () => {
      const token = await getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('getCurrentUserId', () => {
    test('ユーザーIDが未設定の場合はnullを返す', async () => {
      const userId = await getCurrentUserId();

      expect(userId).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('トークンがない場合はfalseを返す', async () => {
      const authenticated = await isAuthenticated();

      expect(authenticated).toBe(false);
    });
  });

  describe('withAuth', () => {
    test('トークンがない場合はエラーをスローする', async () => {
      await expect(
        withAuth(async token => {
          return `token: ${token}`;
        }),
      ).rejects.toThrow('認証が必要です');
    });
  });
});
