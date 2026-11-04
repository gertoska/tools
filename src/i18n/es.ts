import type { Dictionary } from './en';

export const es: Dictionary = {
  'document.title': 'Slugify — generador de slugs gratuito que funciona en tu navegador',
  'app.name': 'Slugify',
  'app.tagline':
    'Convierte cualquier título en un slug limpio. Gratis, sin cuentas y tu texto no sale de esta página.',

  'a11y.skip': 'Ir a la herramienta',
  'lang.switcher': 'Idioma de la interfaz',
  'theme.toggle': 'Cambiar entre tema claro y oscuro',

  'tabs.label': 'Modo',
  'tabs.single': 'Uno',
  'tabs.bulk': 'Varios',

  'input.label': 'Tu texto',
  'input.placeholder': 'Escribe o pega un título…',
  'examples.label': 'Prueba uno:',
  'action.clear': 'Limpiar',

  'result.label': 'Slug',
  'result.placeholder': 'Aquí aparece tu slug',
  'result.empty':
    'No queda nada aprovechable: ninguno de esos caracteres se puede convertir en a–z o 0–9.',
  'counter.characters': '{n} caracteres',
  'counter.seoWarning':
    'Largo para una URL: por debajo de 60 caracteres se lee mejor en los resultados de búsqueda.',
  'action.copy': 'Copiar',
  'action.copyPath': 'Copiar como /ruta',
  'action.copyLink': 'Copiar enlace',

  'status.copied': 'Slug copiado',
  'status.copiedPath': 'Ruta copiada',
  'status.copiedLink': 'Enlace copiado. Lleva tus opciones, nunca tu texto.',
  'status.copiedAll': 'Todos los slugs copiados',
  'status.copyFailed':
    'No se ha podido usar el portapapeles. Selecciona el texto y cópialo con el teclado.',
  'status.downloaded': 'Fichero descargado',
  'status.cleared': 'Limpiado',
  'status.reset': 'Opciones de nuevo en sus valores por defecto',
  'status.nothingToCopy': 'Todavía no hay nada que copiar',

  'options.legend': 'Opciones',
  'options.separator': 'Separador',
  'options.separator.dash': 'Guion ( - )',
  'options.separator.underscore': 'Guion bajo ( _ )',
  'options.separator.dot': 'Punto ( . )',
  'options.lowercase': 'Minúsculas',
  'options.transliterate': 'Transliterar acentos (é → e)',
  'options.removeSpecial': 'Quitar caracteres especiales',
  'options.symbols': 'Símbolos a palabras (& → y)',
  'options.removeNumbers': 'Quitar números',
  'options.advanced': 'Opciones avanzadas',
  'options.language': 'Idioma del contenido',
  'options.language.hint':
    'Elige la tabla de transliteración, las palabras de los símbolos y la lista de stop words.',
  'options.stopwords': 'Quitar stop words',
  'options.maxLength': 'Longitud máxima',
  'options.maxLength.hint': '0 significa sin límite. Corta en un límite de palabra.',
  'action.reset': 'Restablecer opciones',

  'lang.generic': 'Genérico',
  'lang.en': 'Inglés',
  'lang.es': 'Español',
  'lang.ca': 'Catalán',
  'lang.fr': 'Francés',
  'lang.de': 'Alemán',
  'lang.it': 'Italiano',
  'lang.pt': 'Portugués',

  'bulk.label': 'Una línea, un slug',
  'bulk.placeholder': 'Un título por línea…',
  'bulk.dedupe': 'Numerar los slugs repetidos ( -2, -3 )',
  'bulk.copyAll': 'Copiar todo',
  'bulk.downloadTxt': 'Descargar .txt',
  'bulk.downloadCsv': 'Descargar .csv',
  'bulk.columnOriginal': 'Original',
  'bulk.columnSlug': 'Slug',
  'bulk.empty': 'Pega una lista de títulos para ver un slug por línea.',
  'bulk.summary': '{n} líneas',
  'bulk.summaryDuplicates': '{n} líneas, {d} numeradas por repetirse',
  'bulk.truncated': 'Solo se procesan las primeras {n} líneas.',
  'bulk.duplicateBadge': 'repetido',

  'faq.title': 'Preguntas',
  'faq.q1': '¿Guion o guion bajo?',
  'faq.a1':
    'Guion. Los buscadores leen el guion como separación entre palabras y el guion bajo como unión, así que mi-articulo cuenta como dos palabras y mi_articulo como una.',
  'faq.q2': '¿Cuánto debe medir un slug?',
  'faq.a2':
    'Lo bastante poco como para leerse entero en un resultado de búsqueda. Por debajo de 60 caracteres es un techo razonable, y de tres a cinco palabras con significado ganan a una frase entera.',
  'faq.q3': '¿Qué son las stop words?',
  'faq.a3':
    'Palabras pequeñas como el, de o y, que por sí solas aportan poco. Quitarlas acorta el slug sin perder el tema, aunque puede dejar el título con una lectura rara.',
  'faq.q4': '¿Qué hace transliterar?',
  'faq.a4':
    'Reescribe las letras de fuera de a–z con su equivalente ASCII más cercano: é pasa a e, ß a ss y ñ a n. Las URL con acentos funcionan, pero se codifican con porcentajes en cuanto se copian.',
  'faq.q5': '¿Mi texto sale del navegador?',
  'faq.a5':
    'No. No hay servidor, ni subida de ficheros, ni analítica. Abre DevTools → Network y escribe: no sale ni una petición.',
  'faq.q6': '¿Puedo subir un fichero?',
  'faq.a6':
    'No, a propósito. Escribir y pegar son las únicas entradas, y así toda la herramienta cabe en una superficie pequeña y auditable.',

  'footer.privacy': 'Privacidad',
  'footer.source': 'Código fuente',
  'footer.license': 'Licencia MIT',
  'footer.note': 'Sin cuentas, sin cookies, sin analítica, sin subida de ficheros.',

  'privacy.title': 'Privacidad',
  'privacy.back': 'Volver a la herramienta',
  'privacy.intro':
    'Slugify es una página estática. No tiene servidor propio, ni base de datos, ni analítica, así que no hay nada que recoger.',
  'privacy.h1': 'Qué pasa con tu texto',
  'privacy.p1':
    'Se queda en la pestaña. Los slugs los construye JavaScript dentro de tu navegador: el texto no se envía a ningún sitio, no se guarda y no se escribe en el portapapeles salvo que pulses un botón de copiar.',
  'privacy.h2': 'Cómo comprobarlo tú mismo',
  'privacy.p2':
    "Abre DevTools → Network y escribe en la herramienta. No aparece nada. Además la página se sirve con una Content-Security-Policy con connect-src 'none', que le prohíbe hacer ninguna petición de red después de cargar.",
  'privacy.h3': 'Qué se guarda en tu dispositivo',
  'privacy.p3':
    'Tus opciones, tu tema y tu idioma de interfaz, en localStorage, para que la herramienta se abra como la dejaste. Nunca tu texto. «Restablecer opciones» los borra.',
  'privacy.h4': 'Cookies y terceros',
  'privacy.p4':
    'Ninguno. Sin cookies, sin fuentes, scripts o iframes de otros dominios, sin analítica y sin anuncios, incluidos Vercel Analytics y Speed Insights.',
  'privacy.h5': 'Enlaces compartibles',
  'privacy.p5':
    '«Copiar enlace» pone tus opciones en la parte de la URL que va después de #, que los navegadores nunca envían al servidor. Tu texto no se incluye.',
  'privacy.h6': 'Alojamiento',
  'privacy.p6':
    'El sitio lo sirve Vercel como ficheros estáticos, y para entregar la página trata datos de conexión como tu dirección IP, igual que cualquier alojamiento web.',
};
