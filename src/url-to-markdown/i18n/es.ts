import type { Dictionary } from './en';

export const es: Dictionary = {
  'document.title': 'URL a Markdown — convierte cualquier página web en Markdown limpio',
  'app.name': 'URL a Markdown',
  'app.tagline':
    'Pega una dirección web y obtén la página como Markdown limpio. Gratis y sin cuentas. A diferencia de las otras herramientas, necesita nuestro servidor para descargar la página.',

  'input.label': 'Dirección web',
  'input.placeholder': 'https://example.com/blog/articulo',
  'mode.legend': 'Qué convertir',
  'mode.main': 'Solo el contenido principal',
  'mode.full': 'Página completa',
  'action.convert': 'Convertir',
  'action.converting': 'Convirtiendo…',
  'notice.privacy':
    'Para leer la página, la dirección que escribes se envía al servidor de este sitio, que la descarga por ti. Las direcciones y el contenido de las páginas no se guardan ni se registran.',

  'result.label': 'Markdown',
  'result.placeholder': 'El Markdown aparece aquí. Puedes editarlo antes de copiarlo.',
  'result.fallback': 'No se encontró un artículo en esta página, así que se convirtió entera.',
  'result.source': 'Origen: {url}',
  'counter.characters': '{n} caracteres',
  'action.copy': 'Copiar',
  'action.download': 'Descargar .md',
  'option.frontMatter': 'Añadir front matter (título, origen, fecha) a la descarga',

  'status.converting': 'Convirtiendo la página',
  'status.done': 'Markdown listo',
  'status.copied': 'Markdown copiado',
  'status.copyFailed':
    'No se pudo acceder al portapapeles. Selecciona el texto y cópialo con el teclado.',
  'status.downloaded': 'Archivo descargado',

  'error.invalid_url': 'Eso no parece una dirección web válida.',
  'error.blocked':
    'No se puede descargar esa dirección. Solo se admiten sitios públicos en los puertos web estándar.',
  'error.too_many_redirects': 'La página redirigió demasiadas veces.',
  'error.timeout': 'La página tardó demasiado en responder.',
  'error.too_large': 'La página es demasiado grande. El límite es de 2 MB.',
  'error.not_html': 'Esa dirección no es una página web: no devolvió HTML.',
  'error.empty_content':
    'No se encontró texto legible. Las páginas que construyen su contenido con JavaScript no están soportadas.',
  'error.upstream_error': 'El sitio respondió con un error.',
  'error.network': 'No se pudo conectar con el sitio.',
  'error.unknown': 'Algo salió mal. Inténtalo de nuevo en un momento.',

  'about.title': 'Conviene saber',
  'about.body':
    'Funciona con páginas públicas que entregan su texto como HTML. No están soportadas las páginas que necesitan JavaScript para mostrar su contenido, las que requieren iniciar sesión ni las de más de 2 MB.',

  'footer.privacy': 'Privacidad',
};
