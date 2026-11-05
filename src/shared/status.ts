export type Announce = (message: string) => void;

/** Re-setting the text is what makes a repeat message announce again. */
export function createAnnouncer(region: HTMLElement): Announce {
  return (message) => {
    region.textContent = '';
    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  };
}

/** The clipboard is only ever written, never read, and only after a click. */
export async function copyText(text: string): Promise<boolean> {
  if (text === '') return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
  }
}

function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.classList.add('visually-hidden');
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

/** Built and revoked in the page: a download is not a network request. */
export function downloadText(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
