import { describe, expect, it } from 'vitest';
import { calculateQuote, hoursDiscount, roundHalfUp } from '../../src/lib/pricing/engine';
import { formatEuros, formatHours, formatPercent } from '../../src/lib/pricing/format';

/**
 * Tabla de validación del encargo (§5.5), verificada de forma independiente con
 * aritmética exacta de fracciones. Es un banco de pruebas, no una lista de precios.
 */
const fixtures: Array<[number, number, number, number, number, number]> = [
  // alumnos, h/semana, €/h por alumno, €/mes por alumno, €/mes grupo, % ahorro
  [1, 3, 15.0, 180.0, 180.0, 0],
  [1, 4, 14.25, 228.0, 228.0, 5],
  [1, 5, 13.5, 270.0, 270.0, 10],
  [1, 8, 12.0, 384.0, 384.0, 20],
  [2, 3, 10.0, 120.0, 240.0, 33.3333],
  [2, 5, 9.0, 180.0, 360.0, 40],
  [3, 3, 8.0, 96.0, 288.0, 46.6667],
  [3, 5, 7.2, 144.0, 432.0, 52],
  [4, 3, 7.0, 84.0, 336.0, 53.3333],
  [4, 5, 6.3, 126.0, 504.0, 58],
  [4, 8, 5.6, 179.2, 716.8, 62.6667],
];

describe('motor de precios · tabla de validación', () => {
  it.each(fixtures)('%i alumno(s), %d h/semana', (n, h, rate, perStudent, group, saving) => {
    const q = calculateQuote(n, h);
    expect(q.finalHourlyRateRoundedCents).toBe(Math.round(rate * 100));
    expect(q.monthlyPerStudentCents).toBe(Math.round(perStudent * 100));
    expect(q.monthlyGroupCents).toBe(Math.round(group * 100));
    expect(q.savingPercent).toBeCloseTo(saving, 3);
  });

  it('el ahorro en euros es referencia − precio, y concuerda con el porcentaje', () => {
    for (const [n, h] of fixtures) {
      const q = calculateQuote(n, h);
      expect(q.savingPerStudentMonthlyCents).toBe(
        q.referenceMonthlyPerStudentCents - q.monthlyPerStudentCents,
      );
      // El mismo descuento total explica porcentaje y euros (tolerancia de 1 céntimo).
      expect(q.savingPerStudentMonthlyCents).toBeCloseTo(
        q.referenceMonthlyPerStudentCents * q.totalDiscount,
        -0.5,
      );
    }
  });

  it('el ahorro de euros de la tabla coincide (verificación independiente)', () => {
    const expected: Record<string, number> = {
      '1-3': 0, '1-4': 12, '1-5': 30, '1-8': 96, '2-3': 60, '2-5': 120,
      '3-3': 84, '3-5': 156, '4-3': 96, '4-5': 174, '4-8': 300.8,
    };
    for (const [n, h] of fixtures) {
      expect(calculateQuote(n, h).savingPerStudentMonthlyCents).toBe(Math.round(expected[`${n}-${h}`] * 100));
    }
  });
});

describe('descuento por horas', () => {
  it.each([
    [3, 0], [4, 5], [5, 10], [6, 40 / 3], [7, 50 / 3], [8, 20],
  ])('punto de control %d h → %d %', (h, pct) => {
    expect(hoursDiscount(h) * 100).toBeCloseTo(pct, 6);
  });

  it.each([
    [3.5, 2.5], [4.5, 7.5], [5.5, 35 / 3], [6.5, 15], [7.5, 55 / 3],
  ])('interpola linealmente entre puntos (%d h → %d %)', (h, pct) => {
    expect(hoursDiscount(h) * 100).toBeCloseTo(pct, 6);
  });

  it('se mantiene en el 20 % por encima de 8 horas y nunca lo supera', () => {
    for (const h of [8, 8.5, 10, 12, 20, 40, 168]) expect(hoursDiscount(h)).toBeCloseTo(0.2, 10);
  });

  it('no redondea las horas a enteros: 5,5 h se calcula como 5,5 h', () => {
    const q = calculateQuote(1, 5.5);
    expect(q.weeklyHours).toBe(5.5);
    expect(q.monthlyHours).toBe(22);
    // 22 h · 15 € · (1 − 0,11666…) = 291,50 €
    expect(q.monthlyPerStudentCents).toBe(29150);
    const four = calculateQuote(4, 5.5);
    // 22 h · 7 € · (1 − 0,11666…) = 136,03 €
    expect(four.monthlyPerStudentCents).toBe(13603);
    expect(four.monthlyGroupCents).toBe(4 * 13603);
  });

  it('el precio mensual es monótono: más horas nunca abaratan el mes ni suben la tarifa/hora', () => {
    for (const n of [1, 2, 3, 4]) {
      let prevMonth = 0;
      let prevRate = Infinity;
      for (let h = 3; h <= 12; h += 0.5) {
        const q = calculateQuote(n, h);
        expect(q.monthlyPerStudentCents).toBeGreaterThanOrEqual(prevMonth);
        expect(q.finalHourlyRateCents).toBeLessThanOrEqual(prevRate + 1e-9);
        prevMonth = q.monthlyPerStudentCents;
        prevRate = q.finalHourlyRateCents;
      }
    }
  });
});

describe('redondeo y totales', () => {
  it('redondea una sola vez, desde la tarifa sin redondear', () => {
    // 3 alumnos, 6 h: tarifa 6,9333… €/h. 24 h × 6,9333… = 166,40 €; con la tarifa
    // ya redondeada (6,93 €) saldría 166,32 €, que sería incorrecto.
    const q = calculateQuote(3, 6);
    expect(q.finalHourlyRateRoundedCents).toBe(693);
    expect(q.hourlyRateIsRounded).toBe(true);
    expect(q.monthlyPerStudentCents).toBe(16640);
  });

  it('marca la tarifa como exacta cuando no hay redondeo', () => {
    expect(calculateQuote(4, 5).hourlyRateIsRounded).toBe(false);
  });

  it('el total del grupo es siempre n × el importe por alumno mostrado', () => {
    for (const n of [1, 2, 3, 4]) {
      for (let h = 3; h <= 10; h += 0.5) {
        const q = calculateQuote(n, h);
        expect(q.monthlyGroupCents).toBe(n * q.monthlyPerStudentCents);
        expect(Number.isInteger(q.monthlyPerStudentCents)).toBe(true);
      }
    }
  });

  it('roundHalfUp tolera el error de coma flotante y redondea mitades hacia arriba', () => {
    expect(roundHalfUp(12599.999999999998)).toBe(12600);
    expect(roundHalfUp(12345.5)).toBe(12346);
    expect(roundHalfUp(12345.49)).toBe(12345);
  });
});

describe('validación de entradas', () => {
  it('rechaza horas por debajo del mínimo, no numéricas o imposibles', () => {
    expect(() => calculateQuote(1, 2.5)).toThrow(RangeError);
    expect(() => calculateQuote(1, Number.NaN)).toThrow(RangeError);
    expect(() => calculateQuote(1, Infinity)).toThrow(RangeError);
    expect(() => calculateQuote(1, 169)).toThrow(RangeError);
  });

  it('rechaza tamaños de grupo fuera de 1–4 o no enteros', () => {
    for (const n of [0, 5, 2.5, -1]) expect(() => calculateQuote(n, 3)).toThrow(RangeError);
  });
});

describe('formato para el cliente', () => {
  it('importes en es-ES con espacio no separable antes de «€»', () => {
    expect(formatEuros(12600, true)).toBe('126 €');
    expect(formatEuros(17920, true)).toBe('179,20 €');
    expect(formatEuros(630)).toBe('6,30 €');
  });
  it('porcentajes y horas', () => {
    expect(formatPercent(58)).toBe('58 %');
    expect(formatPercent(33.3333)).toBe('33,3 %');
    expect(formatHours(1)).toBe('1 hora');
    expect(formatHours(1.5)).toBe('1,5 horas');
  });
});
