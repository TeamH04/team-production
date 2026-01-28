import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import {
  createHookHarness,
  flushPromises,
  setupReactActEnvironment,
  type HookHarness,
} from '@team/test-utils';
import { act } from 'react';

import { useUserState, type UserStateConfig } from '../useUserState';

import type { UserProfile } from '@team/types';

// =============================================================================
// Test Setup Utilities
// =============================================================================

// React act環境を有効化
setupReactActEnvironment();

// =============================================================================
// Test Data
// =============================================================================

type MockUserProfilePreset = 'minimal' | 'full';

const MOCK_PROFILE_PRESETS: Record<MockUserProfilePreset, UserProfile> = {
  minimal: {
    name: 'テストユーザー',
    email: 'test@example.com',
    isProfileRegistered: true,
  },
  full: {
    name: 'フルユーザー',
    email: 'full@example.com',
    gender: 'other',
    birthYear: '1990',
    birthMonth: '5',
    favoriteGenres: ['カフェ・喫茶', 'ラーメン'],
    isProfileRegistered: true,
  },
};

const createMockUserProfile = (
  overrides: Partial<UserProfile> = {},
  preset: MockUserProfilePreset = 'minimal',
): UserProfile => ({
  ...MOCK_PROFILE_PRESETS[preset],
  ...overrides,
});

// =============================================================================
// Tests
// =============================================================================

describe('useUserState', () => {
  let harness: HookHarness<ReturnType<typeof useUserState>> | undefined;

  afterEach(() => {
    harness?.unmount();
    harness = undefined;
  });

  describe('config なしの場合', () => {
    beforeEach(() => {
      harness = createHookHarness(() => useUserState());
    });

    test('初期状態で user が null', () => {
      assert.equal(harness!.getValue().user, null);
    });

    test('初期状態で isRestoring が false', () => {
      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('初期状態で isProfileComplete が false', () => {
      assert.equal(harness!.getValue().isProfileComplete, false);
    });

    test('setUser でユーザーを設定できる', async () => {
      const profile = createMockUserProfile();

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.deepEqual(harness!.getValue().user, profile);
    });

    test('setUser でオプションフィールドを含む完全なプロファイルを設定できる', async () => {
      const profile = createMockUserProfile({}, 'full');

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.deepEqual(harness!.getValue().user, profile);
      assert.equal(harness!.getValue().user?.gender, 'other');
      assert.deepEqual(harness!.getValue().user?.favoriteGenres, ['カフェ・喫茶', 'ラーメン']);
    });

    test('clearUser でユーザーをクリアできる', async () => {
      const profile = createMockUserProfile();

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      await act(async () => {
        harness!.getValue().clearUser();
      });

      assert.equal(harness!.getValue().user, null);
    });

    test('clearUser を既に null の状態で呼んでもエラーにならない', async () => {
      assert.equal(harness!.getValue().user, null);

      await act(async () => {
        harness!.getValue().clearUser();
      });

      assert.equal(harness!.getValue().user, null);
    });
  });

  describe('fetchUser が指定された場合', () => {
    test('fetchUser が成功するとユーザーが設定される', async () => {
      const mockProfile = createMockUserProfile({ name: '復元ユーザー' });
      const config: UserStateConfig = {
        fetchUser: async () => mockProfile,
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
        await flushPromises();
      });

      assert.deepEqual(harness!.getValue().user, mockProfile);
      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('fetchUser が null を返すとユーザーは null のまま', async () => {
      const config: UserStateConfig = {
        fetchUser: async () => null,
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
        await flushPromises();
      });

      assert.equal(harness!.getValue().user, null);
      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('fetchUser が undefined を返すとユーザーは null のまま', async () => {
      const config: UserStateConfig = {
        fetchUser: async () => undefined as unknown as UserProfile | null,
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
        await flushPromises();
      });

      assert.equal(harness!.getValue().user, null);
      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('fetchUser がエラーを投げても状態が正しくリセットされる', async () => {
      const config: UserStateConfig = {
        fetchUser: async () => {
          throw new Error('認証エラー');
        },
      };

      // エラーが外に伝播しないことを確認
      let thrownError: Error | null = null;
      try {
        await act(async () => {
          harness = createHookHarness(() => useUserState(config));
          await flushPromises();
        });
      } catch (e) {
        thrownError = e as Error;
      }

      assert.equal(thrownError, null, 'エラーが外に伝播しないこと');
      assert.equal(harness!.getValue().user, null);
      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('fetchUser が非 Error オブジェクトを throw してもクラッシュしない', async () => {
      const config: UserStateConfig = {
        fetchUser: async () => {
          throw 'string error';
        },
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
        await flushPromises();
      });

      assert.equal(harness!.getValue().user, null);
      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('isRestoring は復元中に true', async () => {
      let resolvePromise: (value: UserProfile | null) => void;
      const config: UserStateConfig = {
        fetchUser: () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
      });

      // 復元中
      assert.equal(harness!.getValue().isRestoring, true);

      // 復元完了
      await act(async () => {
        resolvePromise!(createMockUserProfile());
        await flushPromises();
      });

      assert.equal(harness!.getValue().isRestoring, false);
    });

    test('fetchUser は一度だけ呼ばれる', async () => {
      let callCount = 0;
      const mockProfile = createMockUserProfile();
      const config: UserStateConfig = {
        fetchUser: async () => {
          callCount++;
          return mockProfile;
        },
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
        await flushPromises();
      });

      // setUser を呼んでも fetchUser は再実行されない
      await act(async () => {
        harness!.getValue().setUser(createMockUserProfile({ name: '別ユーザー' }));
        await flushPromises();
      });

      assert.equal(callCount, 1);
    });

    test('fetchUser 実行中にアンマウントしても setState が呼ばれない', async () => {
      let resolvePromise: (value: UserProfile | null) => void;
      const config: UserStateConfig = {
        fetchUser: () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
      });

      // 復元中にアンマウント
      harness!.unmount();
      harness = undefined;

      // Promise を解決（アンマウント後）- エラーが発生しないことを確認
      let thrownError: Error | null = null;
      try {
        await act(async () => {
          resolvePromise!(createMockUserProfile());
          await flushPromises();
        });
      } catch (e) {
        thrownError = e as Error;
      }

      assert.equal(thrownError, null, 'アンマウント後の setState でエラーが発生しないこと');
    });

    test('config に fetchUser: undefined を明示的に指定した場合は復元しない', async () => {
      const config: UserStateConfig = {
        fetchUser: undefined,
      };

      await act(async () => {
        harness = createHookHarness(() => useUserState(config));
        await flushPromises();
      });

      assert.equal(harness!.getValue().user, null);
      assert.equal(harness!.getValue().isRestoring, false);
    });
  });

  describe('エッジケース', () => {
    beforeEach(() => {
      harness = createHookHarness(() => useUserState());
    });

    test('同じオブジェクト参照で setUser を2回呼んでも正常に動作する', async () => {
      const profile = createMockUserProfile();

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.deepEqual(harness!.getValue().user, profile);
    });

    test('連続した setUser 呼び出しで最後の値が保持される', async () => {
      const profile1 = createMockUserProfile({ name: 'ユーザー1' });
      const profile2 = createMockUserProfile({ name: 'ユーザー2' });
      const profile3 = createMockUserProfile({ name: 'ユーザー3' });

      await act(async () => {
        harness!.getValue().setUser(profile1);
        harness!.getValue().setUser(profile2);
        harness!.getValue().setUser(profile3);
      });

      assert.deepEqual(harness!.getValue().user, profile3);
    });

    test('空文字の name と email でも設定できる', async () => {
      const profile = createMockUserProfile({ name: '', email: '' });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().user?.name, '');
      assert.equal(harness!.getValue().user?.email, '');
    });
  });

  describe('isProfileComplete', () => {
    beforeEach(() => {
      harness = createHookHarness(() => useUserState());
    });

    test('user が null の場合 false', () => {
      assert.equal(harness!.getValue().isProfileComplete, false);
    });

    test('isProfileRegistered が true の場合 true', async () => {
      const profile = createMockUserProfile({ isProfileRegistered: true });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().isProfileComplete, true);
    });

    test('isProfileRegistered が false の場合 false', async () => {
      const profile = createMockUserProfile({ isProfileRegistered: false });

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().isProfileComplete, false);
    });

    test('isProfileRegistered が undefined の場合 false', async () => {
      const profile = {
        name: 'テストユーザー',
        email: 'test@example.com',
      } as UserProfile;

      await act(async () => {
        harness!.getValue().setUser(profile);
      });

      assert.equal(harness!.getValue().isProfileComplete, false);
    });
  });
});
