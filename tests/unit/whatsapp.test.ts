import { describe, expect, it } from 'vitest';
import { buildWhatsAppMessage, buildWhatsAppUrl, LATER } from '../../src/lib/configurator/whatsapp';
import { initialState, summarize, type WizardState } from '../../src/lib/configurator/state';
import { buildDistributions } from '../../src/lib/pricing/sessions';

const state = (patch: Partial<WizardState> = {}): WizardState => ({ ...initialState(), ...patch });
const distId = (h: number, label: string) => buildDistributions(h).options.find((o) => o.label === label)!.id;

function groupOfFour() {
  const s = state({
    planId: 'intensivo',
    formatId: 'grupo4',
    distributionId: distId(5, '2 sesiones de 2 horas y 1 sesión de 1 hora'),
  });
  s.participants[0] = { ...s.participants[0], name: 'Ana López', age: '18–25 años', level: 'Intermedio', objectives: ['conversacion', 'otro'], otherObjective: 'Viajar' };
  s.participants[1] = { ...s.participants[1], name: 'Luis' };
  s.participants[2] = { ...s.participants[2], nameLater: true };
  s.participants[3] = { ...s.participants[3], name: 'Marta', sameObjectives: false, objectives: ['gramatica'] };
  return summarize(s)!;
}

describe('mensaje de WhatsApp', () => {
  const message = buildWhatsAppMessage(groupOfFour());

  it('incluye plan, horas, horas mensuales, sesiones y formato', () => {
    expect(message).toContain('Plan: Plan Intensivo');
    expect(message).toContain('Horas semanales: 5 h (unas 20 h al mes)');
    expect(message).toContain('Sesiones: 2 sesiones de 2 horas y 1 sesión de 1 hora');
    expect(message).toContain('Formato: Grupo de 4 (4 alumnos)');
  });

  it('incluye participantes, objetivos y marca lo pendiente', () => {
    expect(message).toContain('1. Ana López · Edad: 18–25 años · Nivel: Intermedio');
    expect(message).toContain('Objetivos: Conversación y fluidez, Otro: Viajar');
    expect(message).toContain('2. Luis');
    expect(message).toContain('Objetivos: los mismos que el participante 1');
    expect(message).toContain(`3. Nombre: ${LATER}`);
    expect(message).toContain('4. Marta');
    expect(message).toContain('Objetivos: Gramática');
  });

  it('incluye los importes calculados por el motor y la primera clase gratis', () => {
    expect(message).toContain('Tarifa: 6,30 €/h por alumno');
    expect(message).toContain('Precio mensual por alumno: 126 €');
    expect(message).toContain('Coste total del grupo: 504 € al mes');
    expect(message).toContain('Ahorro: 174 € al mes por alumno (58 %)');
    expect(message).toContain('tarifa individual de referencia (15,00 €/h)');
    expect(message).toContain('Primera clase gratis');
  });

  it('no filtra fórmulas ni reglas internas', () => {
    for (const word of ['descuento por horas', 'D_h', 'P_n', '4h', 'fórmula', 'interpol']) {
      expect(message.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });

  it('no usa espacios no separables y no promete matrícula', () => {
    expect(message).not.toMatch(/ /);
    expect(message).toContain('no confirma una matrícula ni garantiza disponibilidad');
  });

  it('en individual no hay total de grupo; con ahorro cero no hay línea de ahorro', () => {
    const s = state({ planId: 'esencial', formatId: 'individual', distributionId: distId(3, '3 sesiones de 1 hora') });
    s.participants[0] = { ...s.participants[0], name: 'Ana', objectives: ['general'] };
    const m = buildWhatsAppMessage(summarize(s)!);
    expect(m).toContain('Precio mensual por alumno: 180 €');
    expect(m).not.toContain('Coste total del grupo');
    expect(m).not.toContain('Ahorro');
  });

  it('marca la tarifa con «≈» cuando está redondeada', () => {
    const s = state({ planId: 'personalizado', customHoursInput: '6', formatId: 'grupo3', distributionId: distId(6, '3 sesiones de 2 horas') });
    s.participants[0] = { ...s.participants[0], name: 'Ana', objectives: ['general'] };
    s.participants[1] = { ...s.participants[1], nameLater: true };
    s.participants[2] = { ...s.participants[2], nameLater: true };
    const m = buildWhatsAppMessage(summarize(s)!);
    expect(m).toContain('Tarifa: ≈ 6,93 €/h por alumno');
    expect(m).toContain('Precio mensual por alumno: 166,40 €');
  });
});

describe('enlace de WhatsApp', () => {
  const msg = 'Hola, Daniel.\n• 126 € & más: ¿qué tal? #1 100%';

  it('codifica el texto de forma segura', () => {
    const r = buildWhatsAppUrl(msg, '34600123456');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toBe(`https://wa.me/34600123456?text=${encodeURIComponent(msg)}`);
      expect(r.url).not.toMatch(/[\s#&]/);
      expect(decodeURIComponent(r.url.split('text=')[1])).toBe(msg);
    }
  });

  it('normaliza el número (+, espacios, guiones)', () => {
    const r = buildWhatsAppUrl('x', '+34 600-123 456');
    expect(r).toEqual({ ok: true, url: 'https://wa.me/34600123456?text=x' });
  });

  it('sin número configurado devuelve un error claro, no un enlace roto', () => {
    expect(buildWhatsAppUrl(msg, '')).toEqual({ ok: false, reason: 'not-configured' });
    expect(buildWhatsAppUrl(msg, undefined)).toEqual({ ok: false, reason: 'not-configured' });
    expect(buildWhatsAppUrl(msg, '   ')).toEqual({ ok: false, reason: 'not-configured' });
  });

  it('rechaza números con formato inválido', () => {
    expect(buildWhatsAppUrl(msg, 'abc')).toEqual({ ok: false, reason: 'invalid-number' });
    expect(buildWhatsAppUrl(msg, '123')).toEqual({ ok: false, reason: 'invalid-number' });
  });

  it('un mensaje completo de grupo de 4 cabe en un enlace razonable', () => {
    const r = buildWhatsAppUrl(buildWhatsAppMessage(groupOfFour()), '34600123456');
    expect(r.ok && r.url.length).toBeLessThan(4000);
  });
});
