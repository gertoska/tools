import { all, byId } from '../../shared/dom';
import type { Mode, Store } from './store';

/** Tabs with the arrow-key behaviour a screen reader user expects. */
export function initTabs(store: Store): void {
  const tabs = all<HTMLButtonElement>('[role="tab"]');
  const single = byId('panel-single');
  const bulk = byId('panel-bulk');

  const select = (mode: Mode, focus: boolean): void => {
    store.setState({ mode });
    if (focus) byId<HTMLButtonElement>(`tab-${mode}`).focus();
  };

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => {
      const mode = tab.dataset['mode'];
      if (mode === 'single' || mode === 'bulk') select(mode, false);
    });

    tab.addEventListener('keydown', (event) => {
      const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (offset === 0) return;
      event.preventDefault();
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      const mode = next?.dataset['mode'];
      if (mode === 'single' || mode === 'bulk') select(mode, true);
    });
  }

  store.subscribe(({ mode }) => {
    for (const tab of tabs) {
      const selected = tab.dataset['mode'] === mode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    single.hidden = mode !== 'single';
    bulk.hidden = mode !== 'bulk';
  });
}
