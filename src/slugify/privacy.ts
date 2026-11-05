import '../shared/styles/variables.css';
import '../shared/styles/base.css';
import './styles/tool.css';

import { applyLocale, i18n } from './i18n';
import { byId } from '../shared/dom';
import { detectLocale } from '../shared/i18n';
import { initLanguageSwitcher } from '../shared/language-switcher';
import { initTheme } from '../shared/theme';

applyLocale(detectLocale());
initTheme(byId<HTMLButtonElement>('theme-toggle'));
initLanguageSwitcher(i18n, () => {
  /* Every string on this page is static, so applying the locale is enough. */
});
