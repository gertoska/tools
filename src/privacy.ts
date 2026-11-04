import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';

import { applyLocale, detectLocale } from './i18n';
import { byId } from './ui/dom';
import { initLanguageSwitcher } from './ui/language-switcher';
import { initTheme } from './ui/theme';

applyLocale(detectLocale());
initTheme(byId<HTMLButtonElement>('theme-toggle'));
initLanguageSwitcher(() => {
  /* Every string on this page is static, so applying the locale is enough. */
});
