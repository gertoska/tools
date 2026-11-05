import '../shared/styles/variables.css';
import '../shared/styles/base.css';
import '../shared/styles/components.css';
import './styles/tool.css';

import { applyLocale, i18n } from './i18n';
import { DEFAULT_SETTINGS, type SlugifySettings } from './engine';
import { loadLanguage } from './engine/data';
import { clearSettings, loadSettings, saveSettings } from './storage';
import { decodeSettings } from './url-state';
import { initBulk } from './ui/bulk';
import { byId } from '../shared/dom';
import { detectLocale } from '../shared/i18n';
import { initLanguageSwitcher } from '../shared/language-switcher';
import { initOptions } from './ui/options';
import { initSingle } from './ui/single';
import { createAnnouncer } from '../shared/status';
import { createStore } from './ui/store';
import { initTabs } from './ui/tabs';
import { initTheme } from '../shared/theme';

/**
 * There is no file input anywhere in the UI, and dropping a file must not make
 * the browser open or read it either.
 */
function blockFileDrops(): void {
  const carriesFiles = (event: DragEvent): boolean =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files');

  window.addEventListener('dragover', (event) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
  });
  window.addEventListener('drop', (event) => {
    if (carriesFiles(event)) event.preventDefault();
  });
}

function isDefault(settings: SlugifySettings): boolean {
  return (Object.keys(DEFAULT_SETTINGS) as (keyof SlugifySettings)[]).every(
    (key) => settings[key] === DEFAULT_SETTINGS[key],
  );
}

async function start(): Promise<void> {
  applyLocale(detectLocale());
  initTheme(byId<HTMLButtonElement>('theme-toggle'));
  blockFileDrops();

  // A shared link wins over what this browser had stored.
  const settings: SlugifySettings = { ...loadSettings(), ...decodeSettings(window.location.hash) };
  const store = createStore({
    mode: 'single',
    text: '',
    bulkText: '',
    dedupe: true,
    settings,
    pack: await loadLanguage(settings.language),
  });

  const announce = createAnnouncer(byId('status'));

  const update = (patch: Partial<SlugifySettings>): void => {
    void (async () => {
      const current = store.getState();
      const next: SlugifySettings = { ...current.settings, ...patch };
      const pack =
        next.language === current.settings.language
          ? current.pack
          : await loadLanguage(next.language);
      store.setState({ settings: next, pack });
      // Reset leaves nothing behind, as the privacy page promises.
      if (isDefault(next)) clearSettings();
      else saveSettings(next);
    })();
  };

  initOptions(store, update, announce);
  initTabs(store);
  initSingle(store, announce);
  initBulk(store, announce);
  initLanguageSwitcher(i18n, () => store.setState({}));

  store.setState({});
}

void start();
