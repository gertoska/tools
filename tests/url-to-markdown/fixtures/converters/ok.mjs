export function htmlToMarkdown(html, pageUrl, mode) {
  return { markdown: `${mode}:${pageUrl}:${html}`, title: 'T', usedFallback: false };
}
