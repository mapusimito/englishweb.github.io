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
  title: 'Clases de inglés en Alicante y online · My Way to English',
  description:
    'Clases de inglés individuales, en pareja o en grupos de hasta 4 en Alicante y online, con un plan adaptado a cómo aprendes.',
};

/** Título para páginas interiores: «{Página} · My Way to English». */
export const pageTitle = (page: string) => `${page} · ${site.brand}`;

export const contact = {
  /**
   * Número de WhatsApp en formato internacional, solo dígitos y sin '+'.
   * Ejemplo de formato: '34600000000'. Vacío = WhatsApp no configurado: el
   * enlace de WhatsApp no aparece y el contacto se hace por el formulario.
   */
  whatsapp: '', // PENDIENTE
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
 * Nota bajo los precios. El brief (§13.6, §19) pide indicar si el precio incluye
 * impuestos, cómo se factura y si hay permanencia. Son decisiones de negocio
 * pendientes: mientras esté vacío no se muestra nada inventado.
 * Ejemplo: 'Precios finales con impuestos incluidos. Pago mensual, sin permanencia.'
 */
export const pricingTerms = ''; // PENDIENTE

/* ------------------------------------------------------------------ */
/* Planes y precios                                                    */
/* ------------------------------------------------------------------ */

export type Plan = {
  id: 'individual' | 'pareja' | 'grupo';
  name: string;
  /** Para quién es (una línea). */
  suits: string;
  /** Precio mensual por alumno, en euros. */
  pricePerStudent: number;
  hoursPerWeek: number;
  /** Línea aclaratoria bajo el precio (opcional). */
  note?: string;
  /** Qué incluye: solo lo que es verdad. */
  included: string[];
};

const includedInAll = ['3 horas a la semana', 'Plan inicial tras el diagnóstico', 'Revisión de progreso'];

/** Orden fijo: Individual, En pareja, Grupo reducido. Mismo peso visual para los tres. */
export const plans: Plan[] = [
  {
    id: 'individual',
    name: 'Individual',
    suits: 'Para avanzar al ritmo exacto que necesitas.',
    pricePerStudent: 240,
    hoursPerWeek: 3,
    included: includedInAll,
  },
  {
    id: 'pareja',
    name: 'En pareja',
    suits: 'Para aprender con alguien de tu nivel.',
    pricePerStudent: 120,
    hoursPerWeek: 3,
    note: '240 € en total para la pareja',
    included: includedInAll,
  },
  {
    id: 'grupo',
    name: 'Grupo reducido',
    suits: 'Para practicar con más voces, hasta 4 alumnos.',
    pricePerStudent: 75,
    hoursPerWeek: 3,
    note: 'Grupos de 3 a 4 alumnos',
    included: includedInAll,
  },
];

/** Datos verificables del servicio (brief §13.4). Sustituyen a cualquier estadística. */
export const facts = [
  { title: 'Máx. 4 alumnos por grupo', detail: 'Grupos pequeños para seguir a cada alumno.' },
  { title: '3 horas a la semana', detail: 'Continuidad semana a semana.' },
  { title: 'En Alicante u online', detail: 'Presencial en Alicante o por videollamada.' },
  { title: 'Un mismo profesor, siempre', detail: 'Cada semana trabajas conmigo.' },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

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
