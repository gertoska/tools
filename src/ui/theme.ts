import { loadTheme, saveTheme, type ThemePreference } from '../lib/storage';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(preference: ThemePreference): void {
  if (preference === 'system') delete document.documentElement.dataset['theme'];
  else document.documentElement.dataset['theme'] = preference;
}

export function initTheme(button: HTMLButtonElement): void {
  let preference = loadTheme();
  apply(preference);

  button.addEventListener('click', () => {
    const isDark = preference === 'dark' || (preference === 'system' && systemPrefersDark());
    preference = isDark ? 'light' : 'dark';
    apply(preference);
    saveTheme(preference);
  });
}
