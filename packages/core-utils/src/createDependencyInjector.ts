export type DependencyInjector<T extends Record<string, unknown>> = {
  get: () => T;
  setForTesting: (overrides: Partial<T>) => void;
  reset: () => void;
};

export function createDependencyInjector<T extends Record<string, unknown>>(
  defaultDependencies: T,
): DependencyInjector<T> {
  let dependencies = defaultDependencies;

  return {
    get: () => dependencies,
    setForTesting: (overrides: Partial<T>) => {
      dependencies = { ...defaultDependencies, ...overrides };
    },
    reset: () => {
      dependencies = defaultDependencies;
    },
  };
}
