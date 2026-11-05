import { all, byId } from '../../shared/dom';
import { getLocale, t } from '../i18n';
import { slugify, toOptions, type LanguagePack, type SlugifySettings } from '../engine';
import { encodeSettings } from '../url-state';
import { copyText, type Announce } from '../../shared/status';
import type { Store } from './store';

/** Past this, a slug stops fitting in a search result. */
const SEO_LIMIT = 60;
/** Only very large pastes wait: typing stays instant. */
const DEBOUNCE_FROM = 20_000;
const DEBOUNCE_MS = 150;

export function initSingle(store: Store, announce: Announce): void {
  const input = byId<HTMLTextAreaElement>('input');
  const output = byId<HTMLTextAreaElement>('output');
  const counter = byId('counter');
  const emptyNotice = byId('empty-notice');
  const clear = byId<HTMLButtonElement>('clear');
  const copy = byId<HTMLButtonElement>('copy');
  const copyPath = byId<HTMLButtonElement>('copy-path');
  const copyLink = byId<HTMLButtonElement>('copy-link');

  let slug = '';
  let timer = 0;

  input.addEventListener('input', () => {
    const { value } = input;
    window.clearTimeout(timer);
    if (value.length < DEBOUNCE_FROM) store.setState({ text: value });
    else timer = window.setTimeout(() => store.setState({ text: value }), DEBOUNCE_MS);
  });

  for (const chip of all<HTMLButtonElement>('[data-example]')) {
    chip.addEventListener('click', () => {
      const example = chip.dataset['example'] ?? '';
      input.value = example;
      store.setState({ text: example });
      input.focus();
    });
  }

  clear.addEventListener('click', () => {
    input.value = '';
    store.setState({ text: '' });
    announce(t('status.cleared'));
    input.focus();
  });

  const copyAnd = (text: string, message: string) => {
    void copyText(text).then((done) => {
      announce(done ? message : t('status.copyFailed'));
    });
  };

  copy.addEventListener('click', () => copyAnd(slug, t('status.copied')));
  copyPath.addEventListener('click', () => copyAnd(`/${slug}`, t('status.copiedPath')));

  copyLink.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = encodeSettings(store.getState().settings);
    copyAnd(url.toString(), t('status.copiedLink'));
  });

  let last: { text: string; settings: SlugifySettings; pack: LanguagePack; locale: string } | null =
    null;

  store.subscribe((state) => {
    const locale = getLocale();
    if (
      last !== null &&
      last.text === state.text &&
      last.settings === state.settings &&
      last.pack === state.pack &&
      last.locale === locale
    ) {
      return;
    }
    last = { text: state.text, settings: state.settings, pack: state.pack, locale };

    slug = slugify(state.text, toOptions(state.settings, state.pack));
    output.value = slug;

    const hasText = state.text.trim() !== '';
    emptyNotice.hidden = !hasText || slug !== '';

    const over = slug.length > SEO_LIMIT;
    counter.classList.toggle('over', over);
    counter.textContent =
      slug === ''
        ? ''
        : over
          ? `${t('counter.characters', { n: slug.length })} · ${t('counter.seoWarning')}`
          : t('counter.characters', { n: slug.length });

    for (const button of [copy, copyPath]) button.disabled = slug === '';
  });
}
