/**
 * Mensaje de solicitud y enlace de WhatsApp (click-to-chat). El cliente revisa y
 * envía el mensaje a mano: nunca se envía nada automáticamente.
 */
import { formatEuros, formatNumber, formatPercent } from '../pricing/format';
import type { QuoteSummary } from './state';

export const LATER = 'se indicará más tarde';

/** Sin espacios no separables: así el texto llega limpio a WhatsApp. */
const plain = (text: string) => text.replace(/\u00a0/g, ' ');
const euros = (cents: number) => plain(formatEuros(cents, true));

/** Texto completo de la solicitud, en español, listo para pegar o abrir en WhatsApp. */
export function buildWhatsAppMessage(s: QuoteSummary): string {
  const q = s.quote;
  const lines: string[] = [];

  lines.push('Hola, Daniel. Quiero solicitar este plan de clases de inglés:', '');

  lines.push('*PLAN*');
  lines.push(`• Plan: ${s.planName}`);
  lines.push(
    `• Horas semanales: ${formatNumber(s.weeklyHours)} h (unas ${formatNumber(q.monthlyHours)} h al mes)`,
  );
  lines.push(`• Sesiones: ${s.distribution.label}`);
  lines.push(`• Formato: ${s.formatName} (${s.students} ${s.students === 1 ? 'alumno' : 'alumnos'})`);
  lines.push('');

  lines.push('*PARTICIPANTES*');
  for (const p of s.participants) {
    const details = [p.age && `Edad: ${p.age}`, p.level && `Nivel: ${p.level}`].filter(Boolean).join(' · ');
    lines.push(`${p.position}. ${p.name ?? `Nombre: ${LATER}`}${details ? ` · ${details}` : ''}`);
    if (p.objectives === null) lines.push('   Objetivos: los mismos que el participante 1');
    else if (p.objectives.length) lines.push(`   Objetivos: ${p.objectives.join(', ')}`);
  }
  lines.push('');

  lines.push('*PRESUPUESTO*');
  const approx = q.hourlyRateIsRounded ? '≈ ' : '';
  lines.push(
    `• Tarifa: ${approx}${plain(formatEuros(q.finalHourlyRateRoundedCents))}/h por alumno`,
  );
  lines.push(`• Precio mensual por alumno: ${euros(q.monthlyPerStudentCents)}`);
  if (s.students > 1) lines.push(`• Coste total del grupo: ${euros(q.monthlyGroupCents)} al mes`);
  if (q.savingPerStudentMonthlyCents > 0) {
    lines.push(
      `• Ahorro: ${euros(q.savingPerStudentMonthlyCents)} al mes por alumno (${plain(
        formatPercent(q.savingPercent),
      )}) frente a la tarifa individual de referencia (${plain(formatEuros(q.referenceRateCents))}/h)`,
    );
  }
  lines.push('• Primera clase gratis');
  lines.push('');

  lines.push(
    'Entiendo que esta solicitud no confirma una matrícula ni garantiza disponibilidad en el horario deseado.',
  );
  return lines.join('\n');
}

export type WhatsAppLink =
  | { ok: true; url: string }
  | { ok: false; reason: 'not-configured' | 'invalid-number' };

/** Enlace wa.me con el texto codificado. Sin número válido no se finge que funciona. */
export function buildWhatsAppUrl(message: string, number: string | undefined | null): WhatsAppLink {
  const raw = (number ?? '').trim();
  if (raw === '') return { ok: false, reason: 'not-configured' };
  const digits = raw.replace(/[\s()-]/g, '').replace(/^\+/, '');
  if (!/^\d{8,15}$/.test(digits)) return { ok: false, reason: 'invalid-number' };
  return { ok: true, url: `https://wa.me/${digits}?text=${encodeURIComponent(message)}` };
}
