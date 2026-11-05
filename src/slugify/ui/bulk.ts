import { byId } from '../../shared/dom';
import { getLocale, t } from '../i18n';
import {
  MAX_BULK_LINES,
  slugifyMany,
  splitLines,
  toOptions,
  type BulkEntry,
  type LanguagePack,
  type SlugifySettings,
} from '../engine';
import { toCsv, toTxt } from '../csv';
import { copyText, downloadText, type Announce } from '../../shared/status';
import type { Store } from './store';

const DEBOUNCE_MS = 180;

function buildRow(entry: BulkEntry): HTMLTableRowElement {
  const row = document.createElement('tr');
  if (entry.deduplicated) row.classList.add('is-duplicate');

  const source = document.createElement('td');
  source.textContent = entry.source;

  const slug = document.createElement('td');
  slug.className = 'slug';
  slug.textContent = entry.slug;
  if (entry.deduplicated) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = t('bulk.duplicateBadge');
    slug.append(badge);
  }

  row.append(source, slug);
  return row;
}

export function initBulk(store: Store, announce: Announce): void {
  const input = byId<HTMLTextAreaElement>('bulk-input');
  const dedupe = byId<HTMLInputElement>('dedupe');
  const summary = byId('bulk-summary');
  const emptyNotice = byId('bulk-empty');
  const table = byId<HTMLTableElement>('bulk-table');
  const body = byId<HTMLTableSectionElement>('bulk-body');
  const clear = byId<HTMLButtonElement>('bulk-clear');
  const copyAll = byId<HTMLButtonElement>('bulk-copy');
  const downloadTxt = byId<HTMLButtonElement>('bulk-txt');
  const downloadCsv = byId<HTMLButtonElement>('bulk-csv');

  let entries: BulkEntry[] = [];
  let timer = 0;

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => store.setState({ bulkText: input.value }), DEBOUNCE_MS);
  });

  dedupe.addEventListener('change', () => store.setState({ dedupe: dedupe.checked }));

  clear.addEventListener('click', () => {
    input.value = '';
    store.setState({ bulkText: '' });
    announce(t('status.cleared'));
    input.focus();
  });

  copyAll.addEventListener('click', () => {
    const slugs = entries.map((entry) => entry.slug).filter((slug) => slug !== '');
    if (slugs.length === 0) {
      announce(t('status.nothingToCopy'));
      return;
    }
    void copyText(slugs.join('\n')).then((done) => {
      announce(done ? t('status.copiedAll') : t('status.copyFailed'));
    });
  });

  downloadTxt.addEventListener('click', () => {
    if (entries.length === 0) {
      announce(t('status.nothingToCopy'));
      return;
    }
    downloadText('slugs.txt', 'text/plain', toTxt(entries.map((entry) => entry.slug)));
    announce(t('status.downloaded'));
  });

  downloadCsv.addEventListener('click', () => {
    if (entries.length === 0) {
      announce(t('status.nothingToCopy'));
      return;
    }
    const csv = toCsv(
      [t('bulk.columnOriginal'), t('bulk.columnSlug')],
      entries.map((entry) => [entry.source, entry.slug]),
    );
    downloadText('slugs.csv', 'text/csv', csv);
    announce(t('status.downloaded'));
  });

  let last: {
    text: string;
    settings: SlugifySettings;
    pack: LanguagePack;
    dedupe: boolean;
    locale: string;
  } | null = null;

  store.subscribe((state) => {
    const locale = getLocale();
    if (
      last !== null &&
      last.text === state.bulkText &&
      last.settings === state.settings &&
      last.pack === state.pack &&
      last.dedupe === state.dedupe &&
      last.locale === locale
    ) {
      return;
    }
    last = {
      text: state.bulkText,
      settings: state.settings,
      pack: state.pack,
      dedupe: state.dedupe,
      locale,
    };

    dedupe.checked = state.dedupe;
    const lines = splitLines(state.bulkText);
    entries = slugifyMany(lines, toOptions(state.settings, state.pack), state.dedupe);

    const fragment = document.createDocumentFragment();
    for (const entry of entries) fragment.append(buildRow(entry));
    body.replaceChildren(fragment);

    const empty = entries.length === 0;
    table.hidden = empty;
    emptyNotice.hidden = !empty;

    const repeats = entries.filter((entry) => entry.deduplicated).length;
    const parts: string[] = [];
    if (!empty) {
      parts.push(
        repeats > 0
          ? t('bulk.summaryDuplicates', { n: entries.length, d: repeats })
          : t('bulk.summary', { n: entries.length }),
      );
    }
    if (lines.length > MAX_BULK_LINES) parts.push(t('bulk.truncated', { n: MAX_BULK_LINES }));
    summary.textContent = parts.join(' · ');

    for (const button of [copyAll, downloadTxt, downloadCsv]) button.disabled = empty;
  });
}
