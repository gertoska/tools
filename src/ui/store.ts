import type { LanguagePack, SlugifySettings } from '../lib/slugify';

export type Mode = 'single' | 'bulk';

export interface AppState {
  mode: Mode;
  text: string;
  bulkText: string;
  dedupe: boolean;
  settings: SlugifySettings;
  pack: LanguagePack;
}

export interface Store {
  getState(): AppState;
  setState(patch: Partial<AppState>): void;
  subscribe(listener: (state: AppState) => void): void;
}

/** Everything the UI needs, in about twenty lines and with no dependencies. */
export function createStore(initial: AppState): Store {
  let state = initial;
  const listeners = new Set<(state: AppState) => void>();

  return {
    getState: () => state,
    setState(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
    },
  };
}
