import { describe, expect, it } from 'vitest';
import {
  initialState,
  normalize,
  parseHours,
  summarize,
  validateStep,
  weeklyHoursOf,
  type WizardState,
} from '../../src/lib/configurator/state';
import { buildDistributions } from '../../src/lib/pricing/sessions';

const base = (patch: Partial<WizardState> = {}): WizardState => ({ ...initialState(), ...patch });
const withParticipants = (s: WizardState, patch: Partial<WizardState['participants'][number]>[]) => ({
  ...s,
  participants: s.participants.map((p, i) => ({ ...p, ...(patch[i] ?? {}) })),
});

describe('horas del plan', () => {
  it('Esencial = 3 h e Intensivo = 5 h, siempre fijas', () => {
    expect(weeklyHoursOf(base({ planId: 'esencial', customHoursInput: '9' }))).toBe(3);
    expect(weeklyHoursOf(base({ planId: 'intensivo', customHoursInput: '9' }))).toBe(5);
  });
  it('Personalizado usa exactamente lo que escribe el cliente', () => {
    expect(weeklyHoursOf(base({ planId: 'personalizado', customHoursInput: '6,5' }))).toBe(6.5);
    expect(weeklyHoursOf(base({ planId: 'personalizado', customHoursInput: '6.5' }))).toBe(6.5);
    expect(weeklyHoursOf(base({ planId: 'personalizado', customHoursInput: '' }))).toBeNull();
    expect(weeklyHoursOf(base({ planId: null }))).toBeNull();
  });
  it.each([
    ['', 'Indica'], ['abc', 'número'], ['2', 'mínimo'], ['200', '168'], ['3,3', 'tramos'],
  ])('rechaza «%s»', (input, fragment) => {
    const r = parseHours(input);
    expect(r.value).toBeNull();
    expect(r.error).toContain(fragment);
  });
  it('propone alternativas compatibles sin cambiar el valor por su cuenta', () => {
    expect(parseHours('3,3').suggestions).toEqual([3, 3.5]);
    expect(parseHours('2').suggestions).toEqual([3]);
  });
  it.each([['3', 3], ['3,5', 3.5], ['10', 10], ['12,5', 12.5], ['168', 168]])('acepta «%s»', (i, v) => {
    expect(parseHours(i)).toEqual({ value: v, error: null, suggestions: [] });
  });
});

describe('normalize: conservar o descartar la combinación de sesiones', () => {
  it('se conserva si sigue siendo válida para las nuevas horas', () => {
    const id = buildDistributions(3).options[0].id;
    expect(normalize(base({ planId: 'esencial', distributionId: id })).distributionId).toBe(id);
  });
  it('se descarta si cambian las horas y ya no cuadra', () => {
    const id = buildDistributions(3).options.find((o) => o.sessions === 2)!.id;
    expect(normalize(base({ planId: 'intensivo', distributionId: id })).distributionId).toBeNull();
  });
});

describe('validación por pantallas', () => {
  it('pantalla 1: exige plan; el personalizado exige horas válidas', () => {
    expect(validateStep(base(), 0).map((e) => e.field)).toEqual(['plan']);
    expect(validateStep(base({ planId: 'esencial' }), 0)).toEqual([]);
    expect(validateStep(base({ planId: 'personalizado', customHoursInput: '2' }), 0).map((e) => e.field)).toEqual(['hours']);
    expect(validateStep(base({ planId: 'personalizado', customHoursInput: '4,5' }), 0)).toEqual([]);
  });

  it('pantalla 2: exige una combinación válida', () => {
    expect(validateStep(base({ planId: 'esencial' }), 1).map((e) => e.field)).toEqual(['distribution']);
    const id = buildDistributions(3).options[0].id;
    expect(validateStep(base({ planId: 'esencial', distributionId: id }), 1)).toEqual([]);
  });

  it('pantalla 3: exige formato', () => {
    expect(validateStep(base(), 2).map((e) => e.field)).toEqual(['format']);
    expect(validateStep(base({ formatId: 'pareja' }), 2)).toEqual([]);
  });

  it('pantalla 4: pide nombre y al menos un objetivo del participante 1', () => {
    const s = base({ formatId: 'individual' });
    expect(validateStep(s, 3).map((e) => e.field)).toEqual(['p0-name', 'p0-objectives']);
    const ok = withParticipants(s, [{ name: 'Ana', objectives: ['gramatica'] }]);
    expect(validateStep(ok, 3)).toEqual([]);
  });

  it('«Otro» obliga a describirlo', () => {
    const s = withParticipants(base({ formatId: 'individual' }), [{ name: 'Ana', objectives: ['otro'] }]);
    expect(validateStep(s, 3).map((e) => e.field)).toEqual(['p0-other']);
    expect(validateStep(withParticipants(s, [{ otherObjective: 'Entrevistas' }]), 3)).toEqual([]);
  });

  it('solo valida a los participantes del formato elegido', () => {
    const one = withParticipants(base({ formatId: 'individual' }), [{ name: 'Ana', objectives: ['general'] }]);
    expect(validateStep(one, 3)).toEqual([]);
    const four = { ...one, formatId: 'grupo4' as const };
    expect(validateStep(four, 3).map((e) => e.field)).toEqual(['p1-name', 'p2-name', 'p3-name']);
  });

  it('los participantes 2+ pueden dejar el nombre para más tarde, el 1 no', () => {
    const s = withParticipants(base({ formatId: 'pareja' }), [
      { name: '', nameLater: true, objectives: ['general'] },
      { nameLater: true },
    ]);
    expect(validateStep(s, 3).map((e) => e.field)).toEqual(['p0-name']);
    expect(validateStep(withParticipants(s, [{ name: 'Ana' }]), 3)).toEqual([]);
  });

  it('exige el «otro» objetivo de un participante solo si no comparte los del 1', () => {
    const s = withParticipants(base({ formatId: 'pareja' }), [
      { name: 'Ana', objectives: ['general'] },
      { name: 'Luis', sameObjectives: false, objectives: ['otro'] },
    ]);
    expect(validateStep(s, 3).map((e) => e.field)).toEqual(['p1-other']);
  });
});

describe('resumen del presupuesto', () => {
  const complete = (): WizardState => {
    const id = buildDistributions(5).options.find((o) => o.label === '2 sesiones de 2 horas y 1 sesión de 1 hora')!.id;
    return withParticipants(
      base({ planId: 'intensivo', distributionId: id, formatId: 'grupo4' }),
      [
        { name: ' Ana López ', objectives: ['conversacion', 'otro'], otherObjective: 'Viajar', level: 'Intermedio' },
        { name: 'Luis', sameObjectives: true },
        { nameLater: true },
        { name: 'Marta', sameObjectives: false, objectives: ['gramatica'] },
      ],
    );
  };
  it('calcula con el formato elegido, no con los campos rellenados', () => {
    const s = summarize(complete())!;
    expect(s.students).toBe(4);
    expect(s.quote.monthlyPerStudentCents).toBe(12600);
    expect(s.quote.monthlyGroupCents).toBe(50400);
    expect(s.participants).toHaveLength(4);
  });
  it('cambiar el formato recalcula y conserva los datos de los participantes', () => {
    const pair = summarize({ ...complete(), formatId: 'pareja' })!;
    expect(pair.students).toBe(2);
    expect(pair.quote.monthlyPerStudentCents).toBe(18000);
    const back = summarize({ ...complete(), formatId: 'grupo4' })!;
    expect(back.participants[3].name).toBe('Marta');
  });
  it('resuelve «Otro», recorta nombres y marca lo pendiente', () => {
    const s = summarize(complete())!;
    expect(s.participants[0]).toMatchObject({ name: 'Ana López', objectives: ['Conversación y fluidez', 'Otro: Viajar'] });
    expect(s.participants[1].objectives).toBeNull();
    expect(s.participants[2].name).toBeNull();
    expect(s.participants[3].objectives).toEqual(['Gramática']);
  });
  it('devuelve null si falta algo', () => {
    expect(summarize(base())).toBeNull();
    expect(summarize({ ...complete(), distributionId: null })).toBeNull();
    expect(summarize({ ...complete(), formatId: null })).toBeNull();
  });
});
