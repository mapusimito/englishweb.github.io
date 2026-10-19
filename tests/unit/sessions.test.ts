import { describe, expect, it } from 'vitest';
import { buildDistributions, isValidDistribution, nearestSupportedHours } from '../../src/lib/pricing/sessions';

const total = (o: { oneHour: number; oneAndHalf: number; twoHours: number }) =>
  o.oneHour + 1.5 * o.oneAndHalf + 2 * o.twoHours;

describe('combinaciones de sesiones', () => {
  it('3 horas: las tres combinaciones del encargo', () => {
    const { supported, options } = buildDistributions(3);
    expect(supported).toBe(true);
    expect(options.map((o) => o.label)).toEqual(
      expect.arrayContaining([
        '3 sesiones de 1 hora',
        '2 sesiones de 1,5 horas',
        '1 sesión de 2 horas y 1 sesión de 1 hora',
      ]),
    );
    expect(options).toHaveLength(3);
  });

  it('5 horas: incluye los ejemplos del encargo', () => {
    const labels = buildDistributions(5).options.map((o) => o.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        '5 sesiones de 1 hora',
        '2 sesiones de 2 horas y 1 sesión de 1 hora',
        '2 sesiones de 1,5 horas y 2 sesiones de 1 hora',
      ]),
    );
  });

  it('todas las combinaciones suman exactamente las horas pedidas', () => {
    for (let h = 3; h <= 20; h += 0.5) {
      const { options, supported } = buildDistributions(h);
      expect(supported).toBe(true);
      expect(options.length).toBeGreaterThan(0);
      for (const o of options) {
        expect(total(o)).toBeCloseTo(h, 10);
        expect(o.totalHours).toBe(h);
        expect(o.sessions).toBe(o.oneHour + o.oneAndHalf + o.twoHours);
      }
    }
  });

  it('no hay duplicados ni exceso de opciones', () => {
    for (let h = 3; h <= 40; h += 0.5) {
      const { options } = buildDistributions(h);
      expect(new Set(options.map((o) => o.id)).size).toBe(options.length);
      expect(new Set(options.map((o) => o.label)).size).toBe(options.length);
      expect(options.length).toBeLessThanOrEqual(6);
    }
  });

  it('horas fraccionarias (3,5 y 5,5) tienen combinaciones válidas', () => {
    expect(buildDistributions(3.5).options.length).toBeGreaterThan(0);
    expect(buildDistributions(5.5).options.length).toBeGreaterThan(0);
    expect(buildDistributions(3.5).options.map((o) => o.label)).toContain(
      '1 sesión de 2 horas y 1 sesión de 1,5 horas',
    );
  });

  it('valores grandes siguen dando combinaciones razonables', () => {
    const { options } = buildDistributions(15);
    expect(options.length).toBeGreaterThan(0);
    expect(Math.max(...options.map((o) => o.sessions))).toBeLessThanOrEqual(8);
  });

  it('si las horas no se pueden formar, lo dice y propone alternativas sin cambiarlas', () => {
    const r = buildDistributions(3.3);
    expect(r.supported).toBe(false);
    expect(r.options).toEqual([]);
    expect(r.suggestions).toEqual([3, 3.5]);
    expect(nearestSupportedHours(5.75)).toEqual([5.5, 6]);
    expect(buildDistributions(Number.NaN).supported).toBe(false);
  });

  it('nunca propone menos del mínimo', () => {
    expect(nearestSupportedHours(2.2).every((h) => h >= 3)).toBe(true);
  });

  it('isValidDistribution distingue combinaciones vigentes de las que ya no lo son', () => {
    const id = buildDistributions(3).options[0].id;
    expect(isValidDistribution(3, id)).toBe(true);
    expect(isValidDistribution(5, id)).toBe(false);
    expect(isValidDistribution(3, null)).toBe(false);
  });
});
