/**
 * Configuración central del sitio.
 *
 * Todo lo que cambia con el negocio (precios, datos de contacto, URL, textos
 * legales pendientes) vive aquí. Los valores vacíos ('') se tratan como
 * "pendiente de configurar": la web no inventa datos y muestra un
 * comportamiento seguro en su lugar (ver README.md).
 */

export const site = {
  /** Nombre de marca: siempre «My Way to English», en esta forma exacta (brief §0). */
  brand: 'My Way to English',
  name: 'Daniel Guanipa',
  role: 'Profesor de inglés',
  city: 'Alicante',
  /** Única tagline permitida (brief §12.6). */
  tagline: 'Aprender inglés empieza por entenderte.',
  /**
   * Dominio público (sin barra final) y subcarpeta donde se sirve la web.
   * Publicada en Vercel, en la raíz del dominio. Con un dominio propio, cámbialo aquí.
   */
  url: 'https://englishweb-mu.vercel.app',
  base: '/',
  locale: 'es_ES',
  // ≤ ~60 caracteres. «en Alicante u online» deja claro que online no es en Alicante.
  title: 'Inglés a tu medida en Alicante u online · My Way to English',
  description:
    'Inglés en grupos de hasta 4, con el mismo profesor y un plan a tu medida, no en un aula de 10. Clases presenciales en Alicante u online.',
};

/** Título para páginas interiores: «{Página} · My Way to English». */
export const pageTitle = (page: string) => `${page} · ${site.brand}`;

export const contact = {
  /**
   * Número de WhatsApp en formato internacional, solo dígitos y sin '+'.
   * Ejemplo de formato: '34600000000'. Vacío = WhatsApp no configurado: el
   * enlace de WhatsApp no aparece y el contacto se hace por el formulario.
   */
  whatsapp: '34614271142',
  /** Teléfono visible (opcional). Formato libre para mostrar, p. ej. '+34 600 00 00 00'. */
  phone: '', // PENDIENTE
  /** Email de contacto (opcional). */
  email: '', // PENDIENTE
  /** Mensaje con el que se abre WhatsApp desde los botones generales. */
  whatsappMessage: 'Hola, Daniel. Me gustaría recibir información sobre tus clases de inglés.',
  /**
   * Endpoint que recibe el formulario (POST, FormData). Compatible con servicios
   * como Formspree, Getform o una función serverless propia. Vacío = sin backend:
   * el formulario envía la solicitud por WhatsApp o email si están configurados,
   * y si no, avisa claramente de que no se ha enviado nada.
   */
  formEndpoint: '', // PENDIENTE
};

export const legal = {
  /** Rutas relativas a la raíz de la web; se les añade `base` al enlazarlas. */
  privacyUrl: 'privacidad/',
  legalNoticeUrl: 'aviso-legal/',
};

/**
 * Nota bajo el presupuesto. El brief (§13.6, §19) pide indicar si el precio incluye
 * impuestos, cómo se factura y si hay permanencia. Son decisiones de negocio
 * pendientes: mientras esté vacío no se muestra nada inventado.
 * Ejemplo: 'Precios finales con impuestos incluidos. Pago mensual, sin permanencia.'
 */
export const pricingTerms = ''; // PENDIENTE

/** Datos verificables del servicio (brief §13.4). Sustituyen a cualquier estadística. */
export const facts = [
  { title: 'Máx. 4 alumnos por grupo', detail: 'Pocos alumnos, para que nadie pase inadvertido.' },
  { title: 'Desde 3 horas a la semana', detail: 'Continuidad semana a semana.' },
  { title: 'Presencial u online', detail: 'En persona en Alicante, o por videollamada desde donde estés.' },
  { title: 'Un mismo profesor, siempre', detail: 'Cada semana trabajas conmigo.' },
];

/* ------------------------------------------------------------------ */
/* Helpers de contacto                                                 */
/* ------------------------------------------------------------------ */

export const hasWhatsapp = /^\d{8,15}$/.test(contact.whatsapp);

export const whatsappUrl = (message = contact.whatsappMessage) =>
  hasWhatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}` : '';

export const phoneHref = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : '';

/** Datos que aún faltan; se listan en consola al compilar. */
export const missingConfig = [
  !hasWhatsapp && 'contact.whatsapp',
  !contact.formEndpoint && 'contact.formEndpoint',
  !contact.email && 'contact.email',
  !contact.phone && 'contact.phone',
].filter(Boolean) as string[];
