/**
 * Configuración del motor de precios (INTERNA).
 *
 * Aquí viven las tarifas base, la escala de descuento por horas y las reglas de
 * sesiones. Es lo único que hay que tocar para cambiar precios: el motor
 * (src/lib/pricing/engine.ts) y la interfaz leen siempre estos valores.
 *
 * Nada de lo que hay en este archivo se muestra tal cual al cliente: la web solo
 * enseña los resultados (tarifa final, precio mensual, ahorro), nunca las reglas.
 */

/** Tarifa base por hora y alumno, según el número de alumnos (en céntimos de euro). */
export const BASE_RATE_CENTS: Readonly<Record<number, number>> = {
  1: 1500,
  2: 1000,
  3: 800,
  4: 700,
};

/** Tarifa de referencia: la individual. Sirve de base para calcular el ahorro total. */
export const REFERENCE_RATE_CENTS = BASE_RATE_CENTS[1];

/**
 * Descuento por horas semanales, en % (puntos de control). Entre dos puntos se
 * interpola linealmente; por encima del último se mantiene su valor.
 * Valores exactos: 40/3 = 13,333…% y 50/3 = 16,666…%.
 */
export const HOURS_DISCOUNT_SCHEDULE: ReadonlyArray<{ hours: number; percent: number }> = [
  { hours: 3, percent: 0 },
  { hours: 4, percent: 5 },
  { hours: 5, percent: 10 },
  { hours: 6, percent: 40 / 3 },
  { hours: 7, percent: 50 / 3 },
  { hours: 8, percent: 20 },
];

/** Semanas facturables por mes: horas mensuales = 4 × horas semanales. */
export const WEEKS_PER_MONTH = 4;

/** Tamaños de grupo admitidos (alumnos, incluida la persona que rellena el formulario). */
export const MIN_STUDENTS = 1;
export const MAX_STUDENTS = 4;

/** Horas semanales: mínimo, incremento y tope físico (una semana tiene 168 horas). */
export const MIN_WEEKLY_HOURS = 3;
export const HOURS_STEP = 0.5;
export const MAX_WEEKLY_HOURS = 168;

/** Duraciones de sesión disponibles, en horas. */
export const SESSION_LENGTHS = [1, 1.5, 2] as const;

/** Máximo de combinaciones de sesiones que se ofrecen al cliente. */
export const MAX_DISTRIBUTION_OPTIONS = 6;
/** Sesiones por semana a partir de las cuales se dejan de ofrecer combinaciones (una al día). */
export const PREFERRED_MAX_SESSIONS = 7;

/** Planes comerciales: tres puertas de entrada al mismo motor de precios. */
export type PlanId = 'esencial' | 'intensivo' | 'personalizado';

export const PLANS: ReadonlyArray<{
  id: PlanId;
  name: string;
  /** Horas fijas; `null` en el plan personalizado (las elige el cliente). */
  hours: number | null;
  tagline: string;
  description: string;
}> = [
  {
    id: 'esencial',
    name: 'Plan Esencial',
    hours: 3,
    tagline: 'Construye una base sólida de inglés con una rutina semanal constante.',
    description:
      '3 horas semanales para avanzar de forma estructurada, con clases adaptadas a tus objetivos.',
  },
  {
    id: 'intensivo',
    name: 'Plan Intensivo',
    hours: 5,
    tagline: 'Dedica más tiempo a tu inglés y aprovecha cada semana para avanzar.',
    description:
      '5 horas semanales para practicar con mayor frecuencia y trabajar tus objetivos con continuidad.',
  },
  {
    id: 'personalizado',
    name: 'Plan Personalizado',
    hours: null,
    tagline: 'Tu aprendizaje no tiene por qué encajar en un plan cerrado.',
    description:
      'Elige las horas semanales que necesitas y descubre una propuesta adaptada a tus objetivos.',
  },
];

/** Valores sugeridos para el plan personalizado (además del selector libre). */
export const SUGGESTED_CUSTOM_HOURS = [4, 6, 7, 8] as const;

/** Formatos de clase: número exacto de alumnos. */
export const FORMATS = [
  { id: 'individual', students: 1, name: 'Individual' },
  { id: 'pareja', students: 2, name: 'En pareja' },
  { id: 'grupo3', students: 3, name: 'Grupo de 3' },
  { id: 'grupo4', students: 4, name: 'Grupo de 4' },
] as const;
export type FormatId = (typeof FORMATS)[number]['id'];
