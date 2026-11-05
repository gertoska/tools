import type { Dictionary } from './en';

export const ca: Dictionary = {
  'document.title': 'URL a Markdown — converteix qualsevol pàgina web en Markdown net',
  'app.name': 'URL a Markdown',
  'app.tagline':
    'Enganxa una adreça web i obtén la pàgina com a Markdown net. Gratuït i sense comptes. A diferència de les altres eines, necessita el nostre servidor per descarregar la pàgina.',

  'input.label': 'Adreça web',
  'input.placeholder': 'https://example.com/blog/article',
  'mode.legend': 'Què convertir',
  'mode.main': 'Només el contingut principal',
  'mode.full': 'Pàgina completa',
  'action.convert': 'Converteix',
  'action.converting': 'Convertint…',
  'notice.privacy':
    'Per llegir la pàgina, l’adreça que escrius s’envia al servidor d’aquest lloc, que la descarrega per tu. Les adreces i el contingut de les pàgines no es desen ni es registren.',

  'result.label': 'Markdown',
  'result.placeholder': 'El Markdown apareix aquí. Pots editar-lo abans de copiar-lo.',
  'result.fallback':
    'No s’ha trobat cap article en aquesta pàgina, així que s’ha convertit sencera.',
  'result.source': 'Origen: {url}',
  'counter.characters': '{n} caràcters',
  'action.copy': 'Copia',
  'action.download': 'Baixa .md',
  'option.frontMatter': 'Afegeix front matter (títol, origen, data) a la baixada',

  'status.converting': 'Convertint la pàgina',
  'status.done': 'Markdown a punt',
  'status.copied': 'Markdown copiat',
  'status.copyFailed':
    'No s’ha pogut accedir al porta-retalls. Selecciona el text i copia’l amb el teclat.',
  'status.downloaded': 'Fitxer baixat',

  'error.invalid_url': 'Això no sembla una adreça web vàlida.',
  'error.blocked':
    'No es pot descarregar aquesta adreça. Només s’admeten llocs públics als ports web estàndard.',
  'error.too_many_redirects': 'La pàgina ha redirigit massa vegades.',
  'error.timeout': 'La pàgina ha tardat massa a respondre.',
  'error.too_large': 'La pàgina és massa gran. El límit és de 2 MB.',
  'error.not_html': 'Aquesta adreça no és una pàgina web: no ha retornat HTML.',
  'error.empty_content':
    'No s’ha trobat text llegible. Les pàgines que construeixen el contingut amb JavaScript no estan suportades.',
  'error.upstream_error': 'El lloc ha respost amb un error.',
  'error.network': 'No s’ha pogut connectar amb el lloc.',
  'error.unknown': 'Alguna cosa ha anat malament. Torna-ho a provar d’aquí a un moment.',

  'about.title': 'Convé saber',
  'about.body':
    'Funciona amb pàgines públiques que entreguen el text com a HTML. No estan suportades les pàgines que necessiten JavaScript per mostrar el contingut, les que demanen iniciar sessió ni les de més de 2 MB.',

  'footer.privacy': 'Privadesa',
};
