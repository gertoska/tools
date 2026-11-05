import type { Dictionary } from './en';

export const ca: Dictionary = {
  'document.title': 'Slugify — generador de slugs gratuït que funciona al teu navegador',
  'app.name': 'Slugify',
  'app.tagline':
    "Converteix qualsevol títol en un slug net. Gratis, sense comptes i el teu text no surt d'aquesta pàgina.",
  'tabs.label': 'Mode',
  'tabs.single': 'Un',
  'tabs.bulk': 'Diversos',
  'input.label': 'El teu text',
  'input.placeholder': 'Escriu o enganxa un títol…',
  'examples.label': "Prova'n un:",
  'action.clear': 'Neteja',
  'result.label': 'Slug',
  'result.placeholder': 'Aquí apareix el teu slug',
  'result.empty':
    "No queda res aprofitable: cap d'aquests caràcters es pot convertir en a–z o 0–9.",
  'counter.characters': '{n} caràcters',
  'counter.seoWarning':
    'Llarg per a una URL: per sota de 60 caràcters es llegeix millor als resultats de cerca.',
  'action.copy': 'Copia',
  'action.copyPath': 'Copia com a /ruta',
  'action.copyLink': "Copia l'enllaç",
  'status.copied': 'Slug copiat',
  'status.copiedPath': 'Ruta copiada',
  'status.copiedLink': 'Enllaç copiat. Porta les teves opcions, mai el teu text.',
  'status.copiedAll': 'Tots els slugs copiats',
  'status.copyFailed':
    "No s'ha pogut fer servir el porta-retalls. Selecciona el text i copia'l amb el teclat.",
  'status.downloaded': 'Fitxer descarregat',
  'status.cleared': 'Netejat',
  'status.reset': 'Opcions de nou als valors per defecte',
  'status.nothingToCopy': 'Encara no hi ha res per copiar',
  'options.legend': 'Opcions',
  'options.separator': 'Separador',
  'options.separator.dash': 'Guionet ( - )',
  'options.separator.underscore': 'Guió baix ( _ )',
  'options.separator.dot': 'Punt ( . )',
  'options.lowercase': 'Minúscules',
  'options.transliterate': 'Translitera els accents (é → e)',
  'options.removeSpecial': 'Treu els caràcters especials',
  'options.symbols': 'Símbols a paraules (& → i)',
  'options.removeNumbers': 'Treu els números',
  'options.advanced': 'Opcions avançades',
  'options.language': 'Idioma del contingut',
  'options.language.hint':
    'Tria la taula de transliteració, les paraules dels símbols i la llista de stop words.',
  'options.stopwords': 'Treu les stop words',
  'options.maxLength': 'Longitud màxima',
  'options.maxLength.hint': '0 vol dir sense límit. Talla en un límit de paraula.',
  'action.reset': 'Restableix les opcions',
  'lang.generic': 'Genèric',
  'lang.en': 'Anglès',
  'lang.es': 'Espanyol',
  'lang.ca': 'Català',
  'lang.fr': 'Francès',
  'lang.de': 'Alemany',
  'lang.it': 'Italià',
  'lang.pt': 'Portuguès',
  'bulk.label': 'Una línia, un slug',
  'bulk.placeholder': 'Un títol per línia…',
  'bulk.dedupe': 'Numera els slugs repetits ( -2, -3 )',
  'bulk.copyAll': 'Copia-ho tot',
  'bulk.downloadTxt': 'Descarrega .txt',
  'bulk.downloadCsv': 'Descarrega .csv',
  'bulk.columnOriginal': 'Original',
  'bulk.columnSlug': 'Slug',
  'bulk.empty': 'Enganxa una llista de títols per veure un slug per línia.',
  'bulk.summary': '{n} línies',
  'bulk.summaryDuplicates': '{n} línies, {d} numerades per repetir-se',
  'bulk.truncated': 'Només es processen les primeres {n} línies.',
  'bulk.duplicateBadge': 'repetit',
  'faq.title': 'Preguntes',
  'faq.q1': 'Guionet o guió baix?',
  'faq.a1':
    'Guionet. Els cercadors llegeixen el guionet com una separació entre paraules i el guió baix com una unió, així que el-meu-article compta com tres paraules i el_meu_article com una.',
  'faq.q2': 'Quant ha de mesurar un slug?',
  'faq.a2':
    'Prou poc per llegir-se sencer en un resultat de cerca. Per sota de 60 caràcters és un sostre raonable, i de tres a cinc paraules amb significat guanyen a una frase sencera.',
  'faq.q3': 'Què són les stop words?',
  'faq.a3':
    "Paraules petites com el, de o i, que per si soles aporten poc. Treure-les escurça l'slug sense perdre'n el tema, encara que pot deixar el títol amb una lectura estranya.",
  'faq.q4': 'Què fa transliterar?',
  'faq.a4':
    "Reescriu les lletres de fora de a–z amb l'equivalent ASCII més proper: é passa a e, ß a ss i ñ a n. Les URL amb accents funcionen, però es codifiquen amb percentatges així que es copien.",
  'faq.q5': 'El meu text surt del navegador?',
  'faq.a5':
    'No. No hi ha servidor, ni pujada de fitxers, ni analítica. Obre DevTools → Network i escriu: no surt ni una petició.',
  'faq.q6': 'Puc pujar un fitxer?',
  'faq.a6':
    "No, a propòsit. Escriure i enganxar són les úniques entrades, i així tota l'eina cap en una superfície petita i auditable.",
  'footer.privacy': 'Privadesa',
  'privacy.title': 'Privadesa',
  'privacy.back': "Torna a l'eina",
  'privacy.intro':
    'Slugify és una pàgina estàtica. No té servidor propi, ni base de dades, ni analítica, així que no hi ha res per recollir.',
  'privacy.h1': 'Què passa amb el teu text',
  'privacy.p1':
    "Es queda a la pestanya. Els slugs els construeix JavaScript dins del teu navegador: el text no s'envia enlloc, no es desa i no s'escriu al porta-retalls llevat que premis un botó de copiar.",
  'privacy.h2': 'Com comprovar-ho tu mateix',
  'privacy.p2':
    "Obre DevTools → Network i escriu a l'eina. No apareix res. A més la pàgina se serveix amb una Content-Security-Policy amb connect-src 'none', que li prohibeix fer cap petició de xarxa després de carregar.",
  'privacy.h3': 'Què es desa al teu dispositiu',
  'privacy.p3':
    "Les teves opcions, el teu tema i el teu idioma d'interfície, a localStorage, perquè l'eina s'obri tal com la vas deixar. Mai el teu text. «Restableix les opcions» els esborra.",
  'privacy.h4': 'Galetes i tercers',
  'privacy.p4':
    "Cap. Sense galetes, sense fonts, scripts o iframes d'altres dominis, sense analítica i sense anuncis, inclosos Vercel Analytics i Speed Insights.",
  'privacy.h5': 'Enllaços compartibles',
  'privacy.p5':
    "«Copia l'enllaç» posa les teves opcions a la part de la URL que va després de #, que els navegadors mai envien al servidor. El teu text no s'hi inclou.",
  'privacy.h6': 'Allotjament',
  'privacy.p6':
    'El lloc el serveix Vercel com a fitxers estàtics, i per lliurar la pàgina tracta dades de connexió com la teva adreça IP, igual que qualsevol allotjament web.',
  'privacy.h7': "Altres eines d'aquest lloc",
  'privacy.p7':
    "Tot el que hi ha més amunt descriu Slugify. URL a Markdown és diferent: per llegir una pàgina l'ha de descarregar, així que l'adreça que escrius s'envia al nostre servidor, que baixa aquesta pàgina per tu i et torna el resultat. Les adreces i el contingut de les pàgines no es desen ni es registren, i no es comparteix res amb tercers. Aquesta eina ho explica a la seva pròpia pàgina, i és l'única que fa una petició.",
};
