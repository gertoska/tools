import '../shared/styles/variables.css';
import '../shared/styles/base.css';
import '../shared/styles/components.css';
import './styles/tool.css';

import { ConversionError, convertUrl, type Conversion, type ConvertMode } from './api';
import { filenameFor, today, withFrontMatter } from './download';
import { applyLocale, i18n, t, type MessageKey } from './i18n';
import { byId } from '../shared/dom';
import { detectLocale } from '../shared/i18n';
import { initLanguageSwitcher } from '../shared/language-switcher';
import { copyText, createAnnouncer, downloadText } from '../shared/status';
import { initTheme } from '../shared/theme';

function selectedMode(): ConvertMode {
  const checked = document.querySelector<HTMLInputElement>('input[name="mode"]:checked');
  return checked?.value === 'full' ? 'full' : 'main';
}

function start(): void {
  applyLocale(detectLocale());
  initTheme(byId<HTMLButtonElement>('theme-toggle'));

  const form = byId<HTMLFormElement>('form');
  const address = byId<HTMLInputElement>('address');
  const convert = byId<HTMLButtonElement>('convert');
  const error = byId('error');
  const output = byId<HTMLTextAreaElement>('output');
  const counter = byId('counter');
  const source = byId('source');
  const fallback = byId('fallback');
  const frontMatter = byId<HTMLInputElement>('front-matter');
  const copy = byId<HTMLButtonElement>('copy');
  const download = byId<HTMLButtonElement>('download');
  const announce = createAnnouncer(byId('status'));

  let current: Conversion | null = null;
  let pending: AbortController | null = null;
  let failure: MessageKey | null = null;

  const render = (): void => {
    const busy = pending !== null;
    convert.disabled = busy;
    convert.textContent = t(busy ? 'action.converting' : 'action.convert');

    error.hidden = failure === null;
    error.textContent = failure === null ? '' : t(failure);

    const hasText = output.value !== '';
    copy.disabled = !hasText;
    download.disabled = !hasText;
    counter.textContent = hasText ? t('counter.characters', { n: output.value.length }) : '';

    source.hidden = current === null;
    source.textContent = current === null ? '' : t('result.source', { url: current.finalUrl });
    fallback.hidden = current === null || !current.usedFallback;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = address.value.trim();
    if (value === '' || pending !== null) {
      if (value === '') {
        failure = 'error.invalid_url';
        render();
        address.focus();
      }
      return;
    }

    pending = new AbortController();
    failure = null;
    render();
    announce(t('status.converting'));

    void convertUrl(value, selectedMode(), pending.signal)
      .then((conversion) => {
        current = conversion;
        output.value = conversion.markdown;
        announce(t('status.done'));
      })
      .catch((reason: unknown) => {
        current = null;
        const code = reason instanceof ConversionError ? reason.code : 'unknown';
        failure = `error.${code}`;
        announce(t(failure));
      })
      .finally(() => {
        pending = null;
        render();
      });
  });

  output.addEventListener('input', render);

  copy.addEventListener('click', () => {
    void copyText(output.value).then((done) => {
      announce(done ? t('status.copied') : t('status.copyFailed'));
    });
  });

  download.addEventListener('click', () => {
    const markdown =
      frontMatter.checked && current !== null
        ? withFrontMatter(output.value, {
            title: current.title,
            source: current.finalUrl,
            date: today(),
          })
        : output.value;
    downloadText(filenameFor(current?.finalUrl ?? address.value.trim()), 'text/markdown', markdown);
    announce(t('status.downloaded'));
  });

  initLanguageSwitcher(i18n, render);
  render();
}

start();
