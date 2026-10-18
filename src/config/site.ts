/**
 * Configuración central del sitio.
 *
 * Todo lo que cambia con el negocio (precios, datos de contacto, URL, textos
 * legales pendientes) vive aquí. Los valores vacíos ('') se tratan como
 * "pendiente de configurar": la web no inventa datos y muestra un
 * comportamiento seguro en su lugar (ver README.md).
 */

export const site = {
  name: 'Daniel Guanipa',
  role: 'Profesor de inglés',
  city: 'Alicante',
  /**
   * Dominio público, sin barra final, y subcarpeta donde se sirve la web.
   * GitHub Pages publica este repositorio en https://mapusimito.github.io/englishweb/.
   * Con un dominio propio: url = 'https://tudominio.com' y base = '/'.
   */
  url: 'https://mapusimito.github.io',
  base: '/englishweb',
  locale: 'es_ES',
  title: 'Daniel Guanipa · Clases de inglés en Alicante',
  description:
    'Clases de inglés particulares, en pareja y en grupos reducidos en Alicante. Un plan estructurado que adapta explicaciones, ejemplos y ritmo a tu nivel, tus objetivos y tus dificultades.',
};

export const contact = {
  /**
   * Número de WhatsApp en formato internacional, solo dígitos y sin '+'.
   * Ejemplo de formato: '34600000000'. Vacío = WhatsApp no configurado:
   * los botones de WhatsApp pasan a "Solicitar información" y llevan al formulario.
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
  /** Ruta relativa a la raíz de la web; se le añade `base` al enlazarla. */
  privacyUrl: 'privacidad/',
};

/* ------------------------------------------------------------------ */
/* Planes y precios                                                    */
/* ------------------------------------------------------------------ */

export type Plan = {
  id: 'individual' | 'pareja' | 'grupo';
  name: string;
  /** Precio mensual por alumno, en euros. */
  pricePerStudent: number;
  hoursPerWeek: number;
  /** Texto del tamaño del grupo. */
  groupSize: string;
  summary: string;
  idealFor: string[];
  /** 0 = máxima atención individual, 1 = máxima interacción en grupo. */
  interaction: number;
};

export const plans: Plan[] = [
  {
    id: 'individual',
    name: 'Clases individuales',
    pricePerStudent: 240,
    hoursPerWeek: 3,
    groupSize: '1 alumno',
    summary:
      'Toda la sesión se adapta a ti: tus objetivos, tus dificultades, tu ritmo y tu manera de entender los conceptos.',
    idealFor: [
      'Objetivos muy específicos o con fecha',
      'Quien prefiere avanzar a su propio ritmo',
      'Alumnos que necesitan reforzar bases con calma',
    ],
    interaction: 0.1,
  },
  {
    id: 'pareja',
    name: 'Clases en pareja',
    pricePerStudent: 120,
    hoursPerWeek: 3,
    groupSize: '2 alumnos',
    summary:
      'Objetivos compartidos con un compañero de nivel parecido y atención muy cercana a las dificultades de cada uno.',
    idealFor: [
      'Dos personas con nivel y objetivos similares',
      'Practicar conversación con un compañero estable',
      'Equilibrio entre atención y precio',
    ],
    interaction: 0.45,
  },
  {
    id: 'grupo',
    name: 'Grupos reducidos',
    pricePerStudent: 75,
    hoursPerWeek: 3,
    groupSize: '3–4 alumnos',
    summary:
      'Objetivos comunes, conversación y aprendizaje entre compañeros, en un grupo pequeño que permite seguir a cada alumno.',
    idealFor: [
      'Quien aprende mejor interactuando',
      'Ganar soltura hablando delante de otros',
      'Una opción más económica por alumno',
    ],
    interaction: 0.85,
  },
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
