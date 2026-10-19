/**
 * Motor de precios de My Way to English (INTERNO).
 *
 * Un único módulo calcula todos los presupuestos; la interfaz nunca repite estas
 * cuentas. Los tres planes comerciales (Esencial, Intensivo y Personalizado) son
 * tres formas de llegar a esta misma función: solo cambia el número de horas.
 *
 * Fórmulas (n = alumnos, h = horas semanales, P_n = tarifa base por alumno y hora,
 * P_ref = tarifa individual de referencia, D_h = descuento por horas):
 *
 *   D_n       = 1 − P_n / P_ref
 *   D_total   = 1 − (1 − D_n)(1 − D_h)
 *   P_final   = P_n (1 − D_h)                  tarifa final por alumno y hora
 *   H_mes     = 4 h                            horas al mes
 *   M_alumno  = 4 h · P_final                  precio mensual por alumno
 *   M_grupo   = n · M_alumno                   precio mensual del grupo
 *   S_%       = 100 · D_total                  ahorro efectivo
 *   S_mes     = 4 h · P_ref − M_alumno         ahorro mensual por alumno
 *
 * Dinero y redondeo (ver docs en README):
 *   - Todo el dinero sale en céntimos enteros.
 *   - M_alumno se calcula con la tarifa SIN redondear y se redondea una sola vez
 *     (a céntimos, mitades hacia arriba).
 *   - M_grupo = n × M_alumno ya redondeado, así que el total del grupo siempre
 *     coincide con la suma de lo que se muestra por alumno.
 *   - El ahorro mensual se calcula con importes ya redondeados, de modo que
 *     referencia − precio = ahorro cuadra exactamente en pantalla.
 */
import {
  BASE_RATE_CENTS,
  HOURS_DISCOUNT_SCHEDULE,
  MAX_STUDENTS,
  MAX_WEEKLY_HOURS,
  MIN_STUDENTS,
  MIN_WEEKLY_HOURS,
  REFERENCE_RATE_CENTS,
  WEEKS_PER_MONTH,
} from '../../config/pricing';

export interface PriceQuote {
  students: number;
  weeklyHours: number;
  monthlyHours: number;
  /** Tarifa base por alumno y hora para este tamaño de grupo (céntimos). */
  baseRateCents: number;
  /** Tarifa individual de referencia por hora (céntimos). */
  referenceRateCents: number;
  /** Descuento por compartir clase respecto a la tarifa individual (0–1). */
  groupDiscount: number;
  /** Descuento por contratar más horas (0–1). */
  hoursDiscount: number;
  /** Descuento total efectivo respecto a la tarifa individual de referencia (0–1). */
  totalDiscount: number;
  /** Tarifa final por alumno y hora, sin redondear (céntimos, con decimales). */
  finalHourlyRateCents: number;
  /** Tarifa final por alumno y hora, redondeada a céntimos para mostrarla. */
  finalHourlyRateRoundedCents: number;
  /** true si la tarifa mostrada está redondeada y ×horas no da exactamente el mensual. */
  hourlyRateIsRounded: boolean;
  /** Precio mensual por alumno (céntimos enteros). */
  monthlyPerStudentCents: number;
  /** Precio mensual total del grupo (céntimos enteros). */
  monthlyGroupCents: number;
  /** Precio mensual por alumno a la tarifa individual de referencia (céntimos). */
  referenceMonthlyPerStudentCents: number;
  /** Ahorro mensual por alumno frente a la tarifa individual de referencia (céntimos). */
  savingPerStudentMonthlyCents: number;
  /** Ahorro efectivo total frente a la tarifa individual de referencia, en %. */
  savingPercent: number;
}

/** Mitades hacia arriba, tolerante al error de coma flotante (p. ej. 12599.999999999). */
export const roundHalfUp = (value: number): number => Math.floor(value + 0.5 + 1e-7);

/** Descuento por horas (0–1): interpolación lineal entre los puntos de control. */
export function hoursDiscount(weeklyHours: number): number {
  assertWeeklyHours(weeklyHours);
  const schedule = HOURS_DISCOUNT_SCHEDULE;
  const last = schedule[schedule.length - 1];
  if (weeklyHours >= last.hours) return last.percent / 100;
  for (let i = 0; i < schedule.length - 1; i++) {
    const from = schedule[i];
    const to = schedule[i + 1];
    if (weeklyHours >= from.hours && weeklyHours <= to.hours) {
      const t = (weeklyHours - from.hours) / (to.hours - from.hours);
      return (from.percent + t * (to.percent - from.percent)) / 100;
    }
  }
  return schedule[0].percent / 100;
}

function assertWeeklyHours(weeklyHours: number): void {
  if (!Number.isFinite(weeklyHours)) throw new RangeError('Las horas semanales deben ser un número.');
  if (weeklyHours < MIN_WEEKLY_HOURS)
    throw new RangeError(`El mínimo es ${MIN_WEEKLY_HOURS} horas semanales.`);
  if (weeklyHours > MAX_WEEKLY_HOURS)
    throw new RangeError(`Una semana solo tiene ${MAX_WEEKLY_HOURS} horas.`);
}

/** Calcula el presupuesto completo para un tamaño de grupo y unas horas semanales. */
export function calculateQuote(students: number, weeklyHours: number): PriceQuote {
  if (!Number.isInteger(students) || students < MIN_STUDENTS || students > MAX_STUDENTS) {
    throw new RangeError(`El grupo debe tener entre ${MIN_STUDENTS} y ${MAX_STUDENTS} alumnos.`);
  }
  assertWeeklyHours(weeklyHours);

  const baseRateCents = BASE_RATE_CENTS[students];
  const referenceRateCents = REFERENCE_RATE_CENTS;
  const groupDiscount = 1 - baseRateCents / referenceRateCents;
  const hoursDisc = hoursDiscount(weeklyHours);
  const totalDiscount = 1 - (1 - groupDiscount) * (1 - hoursDisc);

  const monthlyHours = WEEKS_PER_MONTH * weeklyHours;
  const finalHourlyRateCents = baseRateCents * (1 - hoursDisc);
  const finalHourlyRateRoundedCents = roundHalfUp(finalHourlyRateCents);

  const monthlyPerStudentCents = roundHalfUp(monthlyHours * finalHourlyRateCents);
  const monthlyGroupCents = students * monthlyPerStudentCents;
  const referenceMonthlyPerStudentCents = roundHalfUp(monthlyHours * referenceRateCents);

  return {
    students,
    weeklyHours,
    monthlyHours,
    baseRateCents,
    referenceRateCents,
    groupDiscount,
    hoursDiscount: hoursDisc,
    totalDiscount,
    finalHourlyRateCents,
    finalHourlyRateRoundedCents,
    hourlyRateIsRounded: Math.abs(finalHourlyRateCents - finalHourlyRateRoundedCents) > 1e-6,
    monthlyPerStudentCents,
    monthlyGroupCents,
    referenceMonthlyPerStudentCents,
    savingPerStudentMonthlyCents: referenceMonthlyPerStudentCents - monthlyPerStudentCents,
    savingPercent: 100 * totalDiscount,
  };
}
