import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { act, createContextHarness, type ContextHarness } from '@/test-utils';

import { UserProvider, useUser } from '../UserContext';

import type { UserProfile } from '@team/types';

const createMockUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  name: 'テストユーザー',
  email: 'test@example.com',
  isProfileRegistered: true,
  ...overrides,
});

describe('UserContext', () => {
  let harness: ContextHarness<ReturnType<typeof useUser>> | undefined;

  beforeEach(() => {
    harness = createContextHarness(useUser, UserProvider);
  });

  afterEach(() => {
    harness?.unmount();
    harness = undefined;
  });

  test('useUser throws outside UserProvider', () => {
    harness?.unmount();
    harness = undefined;

    assert.throws(() => {
      createContextHarness(useUser, ({ children }) => <>{children}</>);
    }, /useUser must be used within UserProvider/);
  });

  describe('初期状態', () => {
    test('userがnull', () => {
      assert.equal(harness!.getValue().user, null);
    });

    test('isProfileCompleteがfalse', () => {
      assert.equal(harness!.getValue().isProfileComplete, false);
    });
  });

  describe('setUser', () => {
    test('ユーザー状態を更新する', async () => {
      const profile = createMockUserProfile();

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.deepEqual(harness!.getValue().user, profile);
    });

    test('オプションフィールドを含む完全なプロファイルを設定する', async () => {
      const profile = createMockUserProfile({
        gender: 'male',
        birthYear: '1990',
        birthMonth: '5',
        favoriteGenres: ['カフェ・喫茶', 'ラーメン'],
      });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.deepEqual(harness!.getValue().user, profile);
    });

    test('isProfileRegistered=falseのプロファイルを設定する', async () => {
      const profile = createMockUserProfile({ isProfileRegistered: false });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().user?.isProfileRegistered, false);
    });
  });

  describe('clearUser', () => {
    test('ユーザーをnullにリセットする', async () => {
      const profile = createMockUserProfile();

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      await act(async () => {
        harness!.getValue().clearUser();
      });

      assert.equal(harness!.getValue().user, null);
    });

    test('既にnullの場合も正常に動作する', async () => {
      await act(async () => {
        harness!.getValue().clearUser();
      });

      assert.equal(harness!.getValue().user, null);
    });
  });

  describe('isProfileComplete', () => {
    test('ユーザーが存在しisProfileRegistered=trueの場合true', async () => {
      const profile = createMockUserProfile({ isProfileRegistered: true });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().isProfileComplete, true);
    });

    test('isProfileRegistered=falseの場合false', async () => {
      const profile = createMockUserProfile({ isProfileRegistered: false });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().isProfileComplete, false);
    });

    test('ユーザーがnullの場合false', () => {
      assert.equal(harness!.getValue().isProfileComplete, false);
    });

    test('isProfileRegisteredがundefinedの場合falsy', async () => {
      const profile = {
        name: 'テストユーザー',
        email: 'test@example.com',
      } as UserProfile;

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      // 実装は !!user && user.isProfileRegistered を返すため、
      // isProfileRegistered が undefined の場合は undefined が返る
      assert.ok(!harness!.getValue().isProfileComplete);
    });
  });
});
