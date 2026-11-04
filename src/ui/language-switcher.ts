import { all } from './dom';
import { getLocale, isLocale, setLocale } from '../i18n';

/** EN | ES | CA on the same URL: no reload, no language segment, no query string. */
export function initLanguageSwitcher(onChange: () => void): void {
  const buttons = all<HTMLButtonElement>('.lang-button');

  const paint = (): void => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset['locale'] === getLocale()));
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const locale = button.dataset['locale'];
      if (locale === undefined || !isLocale(locale)) return;
      setLocale(locale);
      paint();
      onChange();
    });
  }

  paint();
}
