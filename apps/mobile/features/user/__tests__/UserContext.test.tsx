import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import React from 'react';

import { act, createContextHarness, type ContextHarness } from '@/test-utils';

import { UserProvider, useUser } from '../UserContext';

import type { UserProfile } from '@team/types';

let harness: ContextHarness<ReturnType<typeof useUser>> | undefined;

afterEach(() => {
  if (harness) {
    harness.unmount();
    harness = undefined;
  }
});

test('useUser throws outside UserProvider', () => {
  assert.throws(() => {
    createContextHarness(useUser, ({ children }) => <>{children}</>);
  }, /useUser must be used within UserProvider/);
});

test('initial user is null', () => {
  harness = createContextHarness(useUser, UserProvider);
  assert.equal(harness.getValue().user, null);
});

test('initial isProfileComplete is false', () => {
  harness = createContextHarness(useUser, UserProvider);
  assert.equal(harness.getValue().isProfileComplete, false);
});

test('setUser updates user state', async () => {
  harness = createContextHarness(useUser, UserProvider);
  const profile: UserProfile = {
    name: 'テストユーザー',
    email: 'test@example.com',
    isProfileRegistered: true,
  };

  await act(async () => {
    harness!.getValue().setUser(profile);
  });

  assert.deepEqual(harness.getValue().user, profile);
});

test('clearUser resets user to null', async () => {
  harness = createContextHarness(useUser, UserProvider);
  const profile: UserProfile = {
    name: 'テストユーザー',
    email: 'test@example.com',
    isProfileRegistered: true,
  };

  await act(async () => {
    harness!.getValue().setUser(profile);
  });

  await act(async () => {
    harness!.getValue().clearUser();
  });

  assert.equal(harness.getValue().user, null);
});

test('isProfileComplete is true when user exists and isProfileRegistered is true', async () => {
  harness = createContextHarness(useUser, UserProvider);
  const profile: UserProfile = {
    name: 'テストユーザー',
    email: 'test@example.com',
    isProfileRegistered: true,
  };

  await act(async () => {
    harness!.getValue().setUser(profile);
  });

  assert.equal(harness.getValue().isProfileComplete, true);
});

test('isProfileComplete is false when isProfileRegistered is false', async () => {
  harness = createContextHarness(useUser, UserProvider);
  const profile: UserProfile = {
    name: 'テストユーザー',
    email: 'test@example.com',
    isProfileRegistered: false,
  };

  await act(async () => {
    harness!.getValue().setUser(profile);
  });

  assert.equal(harness.getValue().isProfileComplete, false);
});

test('isProfileComplete is false when user is null', () => {
  harness = createContextHarness(useUser, UserProvider);
  assert.equal(harness.getValue().isProfileComplete, false);
});

test('setUser with full profile including optional fields', async () => {
  harness = createContextHarness(useUser, UserProvider);
  const profile: UserProfile = {
    name: 'テストユーザー',
    email: 'test@example.com',
    gender: 'male',
    birthYear: '1990',
    birthMonth: '5',
    isProfileRegistered: true,
    favoriteGenres: ['カフェ・喫茶', 'ラーメン'],
  };

  await act(async () => {
    harness!.getValue().setUser(profile);
  });

  assert.deepEqual(harness.getValue().user, profile);
  assert.equal(harness.getValue().user?.gender, 'male');
  assert.equal(harness.getValue().user?.birthYear, '1990');
  assert.deepEqual(harness.getValue().user?.favoriteGenres, ['カフェ・喫茶', 'ラーメン']);
});
