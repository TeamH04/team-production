import assert from 'node:assert/strict';
import { test } from 'node:test';
import { act, useEffect } from 'react';
import TestRenderer from 'react-test-renderer';

import { FavoritesProvider, useFavorites } from '../FavoritesContext';

const globalForReactAct = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
globalForReactAct.IS_REACT_ACT_ENVIRONMENT = true;

const createFavoritesHarness = () => {
  let currentValue: ReturnType<typeof useFavorites> | undefined;
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;

  const handleValue = (value: ReturnType<typeof useFavorites>) => {
    currentValue = value;
  };

  const Consumer = ({ onValue }: { onValue: (value: ReturnType<typeof useFavorites>) => void }) => {
    const value = useFavorites();

    useEffect(() => {
      onValue(value);
    }, [onValue, value]);

    return null;
  };

  act(() => {
    renderer = TestRenderer.create(
      <FavoritesProvider>
        <Consumer onValue={handleValue} />
      </FavoritesProvider>
    );
  });

  if (!currentValue || !renderer) {
    throw new Error('FavoritesProvider setup failed');
  }

  return {
    getValue: () => {
      if (!currentValue) {
        throw new Error('FavoritesProvider setup failed');
      }

      return currentValue;
    },
    unmount: () => {
      act(() => {
        renderer!.unmount();
      });
    },
  };
};

test('useFavorites throws outside FavoritesProvider', () => {
  const Consumer = () => {
    useFavorites();
    return null;
  };

  assert.throws(() => {
    act(() => {
      TestRenderer.create(<Consumer />);
    });
  }, /useFavorites must be used within FavoritesProvider/);
});

test('addFavorite marks a shop as favorite', () => {
  const { getValue, unmount } = createFavoritesHarness();

  act(() => {
    getValue().addFavorite('shop-1');
  });

  assert.equal(getValue().isFavorite('shop-1'), true);
  assert.equal(getValue().favorites.has('shop-1'), true);

  unmount();
});

test('removeFavorite removes a shop from favorites', () => {
  const { getValue, unmount } = createFavoritesHarness();

  act(() => {
    getValue().addFavorite('shop-2');
  });

  act(() => {
    getValue().removeFavorite('shop-2');
  });

  assert.equal(getValue().isFavorite('shop-2'), false);
  assert.equal(getValue().favorites.has('shop-2'), false);

  unmount();
});

test('toggleFavorite adds and removes a shop', () => {
  const { getValue, unmount } = createFavoritesHarness();

  act(() => {
    getValue().toggleFavorite('shop-3');
  });

  assert.equal(getValue().isFavorite('shop-3'), true);

  act(() => {
    getValue().toggleFavorite('shop-3');
  });

  assert.equal(getValue().isFavorite('shop-3'), false);

  unmount();
});
