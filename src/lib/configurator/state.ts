/**
 * Estado, validación y datos derivados del configurador. Todo son funciones
 * puras: la interfaz solo pinta lo que sale de aquí.
 */
import {
  FORMATS,
  HOURS_STEP,
  MAX_WEEKLY_HOURS,
  MIN_WEEKLY_HOURS,
  PLANS,
  type FormatId,
  type PlanId,
} from '../../config/pricing';
import { calculateQuote, type PriceQuote } from '../pricing/engine';
import { formatNumber } from '../pricing/format';
import {
  buildDistributions,
  isValidDistribution,
  nearestSupportedHours,
  type SessionDistribution,
} from '../pricing/sessions';

export const STEPS = ['Plan', 'Sesiones', 'Formato', 'Participantes', 'Presupuesto'] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4;

export const OBJECTIVES = [
  { id: 'conversacion', label: 'Conversación y fluidez' },
  { id: 'gramatica', label: 'Gramática' },
  { id: 'auditiva', label: 'Comprensión auditiva' },
  { id: 'lectoescritura', label: 'Lectura y escritura' },
  { id: 'academico', label: 'Inglés académico' },
  { id: 'profesional', label: 'Inglés profesional' },
  { id: 'examenes', label: 'Preparación de exámenes' },
  { id: 'general', label: 'Mejorar mi inglés general' },
  { id: 'otro', label: 'Otro' },
] as const;
export type ObjectiveId = (typeof OBJECTIVES)[number]['id'];

export const LEVELS = [
  'No estoy seguro/a',
  'Principiante',
  'Básico',
  'Intermedio',
  'Avanzado',
] as const;
export const AGE_RANGES = ['Menos de 12 años', '12–17 años', '18–25 años', '26–40 años', 'Más de 40 años'] as const;

export interface Participant {
  name: string;
  /** El nombre se indicará más tarde (solo permitido a partir del participante 2). */
  nameLater: boolean;
  age: string;
  level: string;
  objectives: ObjectiveId[];
  otherObjective: string;
  /** Participantes 2+: comparten los objetivos del participante 1. */
  sameObjectives: boolean;
}

export interface WizardState {
  step: StepIndex;
  planId: PlanId | null;
  /** Texto tal cual lo escribe el cliente en el plan personalizado. */
  customHoursInput: string;
  distributionId: string | null;
  formatId: FormatId | null;
  /** Siempre 4 entradas: así no se pierden datos al cambiar de formato y volver. */
  participants: Participant[];
}

export const emptyParticipant = (): Participant => ({
  name: '',
  nameLater: false,
  age: '',
  level: '',
  objectives: [],
  otherObjective: '',
  sameObjectives: true,
});

export const initialState = (): WizardState => ({
  step: 0,
  planId: null,
  customHoursInput: '',
  distributionId: null,
  formatId: null,
  participants: [emptyParticipant(), emptyParticipant(), emptyParticipant(), emptyParticipant()],
});

/* ---------------------------------------------------------------- */
/* Horas                                                             */
/* ---------------------------------------------------------------- */

export interface HoursParse {
  value: number | null;
  error: string | null;
  /** Alternativas compatibles que el cliente puede aceptar con un clic. */
  suggestions: number[];
}

/** Interpreta lo que escribe el cliente («4,5», «4.5», «6»). */
export function parseHours(raw: string): HoursParse {
  const text = raw.trim().replace(',', '.');
  if (text === '') {
    return { value: null, error: 'Indica cuántas horas semanales quieres.', suggestions: [] };
  }
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return { value: null, error: 'Escribe un número, por ejemplo 4 o 4,5.', suggestions: [] };
  }
  const value = Number(text);
  if (value < MIN_WEEKLY_HOURS) {
    return {
      value: null,
      error: `El mínimo son ${formatNumber(MIN_WEEKLY_HOURS)} horas semanales.`,
      suggestions: [MIN_WEEKLY_HOURS],
    };
  }
  if (value > MAX_WEEKLY_HOURS) {
    return { value: null, error: `Una semana solo tiene ${MAX_WEEKLY_HOURS} horas.`, suggestions: [] };
  }
  if (Math.abs(value / HOURS_STEP - Math.round(value / HOURS_STEP)) > 1e-9) {
    const suggestions = nearestSupportedHours(value);
    return {
      value: null,
      error: `Las horas se eligen en tramos de ${formatNumber(HOURS_STEP)}. ¿Prefieres ${suggestions
        .map((s) => `${formatNumber(s)} h`)
        .join(' o ')}?`,
      suggestions,
    };
  }
  return { value, error: null, suggestions: [] };
}

/** Horas semanales elegidas, o null si todavía no hay un valor válido. */
export function weeklyHoursOf(state: Pick<WizardState, 'planId' | 'customHoursInput'>): number | null {
  const plan = PLANS.find((p) => p.id === state.planId);
  if (!plan) return null;
  if (plan.hours !== null) return plan.hours;
  return parseHours(state.customHoursInput).value;
}

export const studentsOf = (formatId: FormatId | null): number | null =>
  FORMATS.find((f) => f.id === formatId)?.students ?? null;

/**
 * Tras cualquier cambio: si las horas cambian y la combinación de sesiones elegida
 * deja de ser válida, se borra (se vuelve a pedir); si sigue siéndolo, se conserva.
 */
export function normalize(state: WizardState): WizardState {
  const hours = weeklyHoursOf(state);
  const keep = hours !== null && isValidDistribution(hours, state.distributionId);
  return keep || state.distributionId === null ? state : { ...state, distributionId: null };
}

/* ---------------------------------------------------------------- */
/* Validación por pantallas                                          */
/* ---------------------------------------------------------------- */

export interface FieldError {
  /** id del campo que recibe el foco (y el aria-describedby). */
  field: string;
  message: string;
}

const MAX_NAME_LENGTH = 80;
const MAX_OTHER_LENGTH = 160;

export function validateStep(state: WizardState, step: StepIndex): FieldError[] {
  const errors: FieldError[] = [];

  if (step === 0) {
    if (!state.planId) {
      errors.push({ field: 'plan', message: 'Elige un plan para continuar.' });
    } else if (state.planId === 'personalizado') {
      const parsed = parseHours(state.customHoursInput);
      if (parsed.error) errors.push({ field: 'hours', message: parsed.error });
    }
  }

  if (step === 1) {
    const hours = weeklyHoursOf(state);
    if (hours === null || !isValidDistribution(hours, state.distributionId)) {
      errors.push({ field: 'distribution', message: 'Elige cómo quieres repartir las horas.' });
    }
  }

  if (step === 2) {
    if (!state.formatId) errors.push({ field: 'format', message: 'Elige un formato para continuar.' });
  }

  if (step === 3) {
    const count = studentsOf(state.formatId) ?? 1;
    for (let i = 0; i < count; i++) {
      const p = state.participants[i];
      if (!(i > 0 && p.nameLater) && p.name.trim() === '') {
        errors.push({
          field: `p${i}-name`,
          message: i === 0 ? 'Escribe tu nombre completo.' : `Escribe el nombre del participante ${i + 1} o marca que lo indicarás más tarde.`,
        });
      } else if (p.name.trim().length > MAX_NAME_LENGTH) {
        errors.push({ field: `p${i}-name`, message: `El nombre es demasiado largo (máximo ${MAX_NAME_LENGTH} caracteres).` });
      }
      const ownObjectives = i === 0 || !p.sameObjectives;
      if (i === 0 && p.objectives.length === 0) {
        errors.push({ field: `p${i}-objectives`, message: 'Elige al menos un objetivo.' });
      }
      if (ownObjectives && p.objectives.includes('otro') && p.otherObjective.trim() === '') {
        errors.push({ field: `p${i}-other`, message: i === 0 ? 'Cuéntanos cuál es tu otro objetivo.' : `Cuéntanos cuál es el otro objetivo del participante ${i + 1}.` });
      } else if (p.otherObjective.length > MAX_OTHER_LENGTH) {
        errors.push({ field: `p${i}-other`, message: `Máximo ${MAX_OTHER_LENGTH} caracteres.` });
      }
    }
  }

  return errors;
}

/* ---------------------------------------------------------------- */
/* Datos derivados para el presupuesto y el mensaje                  */
/* ---------------------------------------------------------------- */

export interface ParticipantSummary {
  position: number;
  /** null cuando se indicará más tarde. */
  name: string | null;
  age: string;
  level: string;
  /** Lista ya con «Otro: …» resuelto; null si comparte los del participante 1. */
  objectives: string[] | null;
}

export interface QuoteSummary {
  planName: string;
  weeklyHours: number;
  distribution: SessionDistribution;
  formatName: string;
  students: number;
  participants: ParticipantSummary[];
  quote: PriceQuote;
}

const objectivesOf = (p: Participant): string[] =>
  p.objectives.map((id) => {
    const label = OBJECTIVES.find((o) => o.id === id)!.label;
    return id === 'otro' && p.otherObjective.trim() ? `Otro: ${p.otherObjective.trim()}` : label;
  });

/** Presupuesto completo, o null si falta algún dato (no se inventa nada). */
export function summarize(state: WizardState): QuoteSummary | null {
  const plan = PLANS.find((p) => p.id === state.planId);
  const hours = weeklyHoursOf(state);
  const format = FORMATS.find((f) => f.id === state.formatId);
  if (!plan || hours === null || !format) return null;
  const distribution = buildDistributions(hours).options.find((o) => o.id === state.distributionId);
  if (!distribution) return null;

  const participants: ParticipantSummary[] = [];
  for (let i = 0; i < format.students; i++) {
    const p = state.participants[i];
    participants.push({
      position: i + 1,
      name: i > 0 && p.nameLater ? null : p.name.trim(),
      age: p.age,
      level: p.level,
      objectives: i > 0 && p.sameObjectives ? null : objectivesOf(p),
    });
  }

  return {
    planName: plan.name,
    weeklyHours: hours,
    distribution,
    formatName: format.name,
    students: format.students,
    participants,
    quote: calculateQuote(format.students, hours),
  };
}
