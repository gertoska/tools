import { COMMON_MESSAGES, createI18n } from '../shared/i18n';

const en = {
  'document.title': 'Tools — small, free utilities that run in your browser',
  'app.name': 'Tools',
  'app.tagline':
    'Small, free utilities that run entirely in your browser. No accounts and no uploads.',
  'hub.list': 'All tools',
  'tool.slugify.name': 'Slugify',
  'tool.slugify.desc': 'Turn any title into a clean URL slug, one at a time or in bulk.',
} as const;

type HubDictionary = Readonly<Record<keyof typeof en, string>>;

const es: HubDictionary = {
  'document.title': 'Herramientas — utilidades pequeñas y gratuitas que funcionan en tu navegador',
  'app.name': 'Herramientas',
  'app.tagline':
    'Utilidades pequeñas y gratuitas que funcionan por completo en tu navegador. Sin cuentas y sin subir nada.',
  'hub.list': 'Todas las herramientas',
  'tool.slugify.name': 'Slugify',
  'tool.slugify.desc': 'Convierte cualquier título en un slug limpio, uno a uno o en bloque.',
};

const ca: HubDictionary = {
  'document.title': 'Eines — utilitats petites i gratuïtes que funcionen al teu navegador',
  'app.name': 'Eines',
  'app.tagline':
    'Utilitats petites i gratuïtes que funcionen del tot al teu navegador. Sense comptes i sense pujar res.',
  'hub.list': 'Totes les eines',
  'tool.slugify.name': 'Slugify',
  'tool.slugify.desc': 'Converteix qualsevol títol en un slug net, un a un o en bloc.',
};

export const i18n = createI18n({
  en: { ...COMMON_MESSAGES.en, ...en },
  es: { ...COMMON_MESSAGES.es, ...es },
  ca: { ...COMMON_MESSAGES.ca, ...ca },
});
