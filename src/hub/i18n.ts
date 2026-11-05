import { COMMON_MESSAGES, createI18n } from '../shared/i18n';

const en = {
  'document.title': 'Tools — small, free utilities that run in your browser',
  'app.name': 'Tools',
  'app.tagline':
    'Small, free utilities with no accounts and no tracking. Most run entirely in your browser, and each tool says when it needs a server.',
  'hub.list': 'All tools',
  'tool.slugify.name': 'Slugify',
  'tool.slugify.desc': 'Turn any title into a clean URL slug, one at a time or in bulk.',
  'tool.urlToMarkdown.name': 'URL to Markdown',
  'tool.urlToMarkdown.desc':
    'Turn a web page into clean Markdown. Uses our server to fetch the page.',
} as const;

type HubDictionary = Readonly<Record<keyof typeof en, string>>;

const es: HubDictionary = {
  'document.title': 'Herramientas — utilidades pequeñas y gratuitas que funcionan en tu navegador',
  'app.name': 'Herramientas',
  'app.tagline':
    'Utilidades pequeñas y gratuitas, sin cuentas y sin rastreo. La mayoría funcionan por completo en tu navegador, y cada herramienta avisa cuando necesita un servidor.',
  'hub.list': 'Todas las herramientas',
  'tool.slugify.name': 'Slugify',
  'tool.slugify.desc': 'Convierte cualquier título en un slug limpio, uno a uno o en bloque.',
  'tool.urlToMarkdown.name': 'URL a Markdown',
  'tool.urlToMarkdown.desc':
    'Convierte una página web en Markdown limpio. Usa nuestro servidor para descargar la página.',
};

const ca: HubDictionary = {
  'document.title': 'Eines — utilitats petites i gratuïtes que funcionen al teu navegador',
  'app.name': 'Eines',
  'app.tagline':
    'Utilitats petites i gratuïtes, sense comptes i sense rastreig. La majoria funcionen del tot al teu navegador, i cada eina avisa quan necessita un servidor.',
  'hub.list': 'Totes les eines',
  'tool.slugify.name': 'Slugify',
  'tool.slugify.desc': 'Converteix qualsevol títol en un slug net, un a un o en bloc.',
  'tool.urlToMarkdown.name': 'URL a Markdown',
  'tool.urlToMarkdown.desc':
    'Converteix una pàgina web en Markdown net. Fa servir el nostre servidor per descarregar la pàgina.',
};

export const i18n = createI18n({
  en: { ...COMMON_MESSAGES.en, ...en },
  es: { ...COMMON_MESSAGES.es, ...es },
  ca: { ...COMMON_MESSAGES.ca, ...ca },
});
