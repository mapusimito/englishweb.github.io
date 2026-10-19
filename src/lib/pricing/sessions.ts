/**
 * Combinaciones de sesiones semanales (1 h, 1,5 h y 2 h) que suman exactamente
 * las horas elegidas. Se calcula en medias horas para evitar errores de coma
 * flotante. Nunca se altera la cifra pedida: si no se puede representar, se dice.
 */
import {
  HOURS_STEP,
  MAX_DISTRIBUTION_OPTIONS,
  MIN_WEEKLY_HOURS,
  PREFERRED_MAX_SESSIONS,
} from '../../config/pricing';
import { formatNumber } from './format';

export interface SessionDistribution {
  /** Identificador estable: «a-b-c» (sesiones de 1 h, 1,5 h y 2 h). */
  id: string;
  oneHour: number;
  oneAndHalf: number;
  twoHours: number;
  sessions: number;
  totalHours: number;
  label: string;
}

export interface DistributionResult {
  /** true si las horas se pueden formar con sesiones de 1, 1,5 y 2 horas. */
  supported: boolean;
  options: SessionDistribution[];
  /** Alternativas compatibles (múltiplos de media hora) cuando no se puede. */
  suggestions: number[];
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

function describe(count: number, length: number): string {
  return `${count} ${plural(count, 'sesión', 'sesiones')} de ${formatNumber(length)} ${
    length === 1 ? 'hora' : 'horas'
  }`;
}

/** Texto de una combinación: «2 sesiones de 1,5 horas y 1 sesión de 1 hora». */
export function describeDistribution(d: Pick<SessionDistribution, 'oneHour' | 'oneAndHalf' | 'twoHours'>) {
  const parts: string[] = [];
  if (d.twoHours) parts.push(describe(d.twoHours, 2));
  if (d.oneAndHalf) parts.push(describe(d.oneAndHalf, 1.5));
  if (d.oneHour) parts.push(describe(d.oneHour, 1));
  return parts.join(' y ');
}

/** Todas las combinaciones válidas (sin recortar), de más a menos sesiones. */
function enumerate(halfHours: number): SessionDistribution[] {
  const all: SessionDistribution[] = [];
  for (let c = 0; 4 * c <= halfHours; c++) {
    for (let b = 0; 4 * c + 3 * b <= halfHours; b++) {
      const rest = halfHours - 4 * c - 3 * b;
      if (rest % 2 !== 0) continue; // las sesiones de 1 h ocupan 2 medias horas
      const a = rest / 2;
      const d = { oneHour: a, oneAndHalf: b, twoHours: c };
      all.push({
        id: `${a}-${b}-${c}`,
        ...d,
        sessions: a + b + c,
        totalHours: halfHours / 2,
        label: describeDistribution(d),
      });
    }
  }
  return all;
}

const variety = (d: SessionDistribution) => [d.oneHour, d.oneAndHalf, d.twoHours].filter(Boolean).length;

/** Horas compatibles más cercanas (por debajo y por encima), nunca menos del mínimo. */
export function nearestSupportedHours(hours: number): number[] {
  const lower = Math.max(MIN_WEEKLY_HOURS, Math.floor(hours / HOURS_STEP) * HOURS_STEP);
  const upper = Math.max(MIN_WEEKLY_HOURS, Math.ceil(hours / HOURS_STEP) * HOURS_STEP);
  return [...new Set([lower, upper])];
}

export function buildDistributions(weeklyHours: number): DistributionResult {
  const halfHours = Math.round(weeklyHours * 2);
  const exact = Number.isFinite(weeklyHours) && Math.abs(weeklyHours * 2 - halfHours) < 1e-9;
  if (!exact || halfHours < 2) {
    return { supported: false, options: [], suggestions: nearestSupportedHours(weeklyHours) };
  }

  const maxSessions = Math.max(PREFERRED_MAX_SESSIONS, Math.ceil(weeklyHours / 2));
  const candidates = enumerate(halfHours).filter((d) => d.sessions <= maxSessions);

  // Se priorizan las combinaciones más simples (menos tipos de sesión) y, a igualdad,
  // las que tienen menos sesiones; después se muestran de menos a más sesiones.
  const options = candidates
    .sort((x, y) => variety(x) - variety(y) || x.sessions - y.sessions || x.id.localeCompare(y.id))
    .slice(0, MAX_DISTRIBUTION_OPTIONS)
    .sort((x, y) => x.sessions - y.sessions || variety(x) - variety(y) || x.id.localeCompare(y.id));

  return { supported: options.length > 0, options, suggestions: [] };
}

/** ¿Sigue siendo válida una combinación elegida para estas horas? */
export function isValidDistribution(weeklyHours: number, id: string | null): boolean {
  return id !== null && buildDistributions(weeklyHours).options.some((o) => o.id === id);
}
