/** Formato de importes, horas y porcentajes para mostrar al cliente (es-ES). */

const eurosFull = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const eurosWhole = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const percent = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

/** «126 €» si es un importe entero y `compact`; si no, «179,20 €». Espacio no separable antes de «€». */
export function formatEuros(cents: number, compact = false): string {
  const whole = cents % 100 === 0;
  return (compact && whole ? eurosWhole : eurosFull).format(cents / 100);
}

/** «58 %» o «33,3 %». */
export const formatPercent = (value: number): string => percent.format(value / 100);

/** «1,5» o «3». */
export const formatNumber = (value: number): string => decimal.format(value);

/** «1 hora», «1,5 horas», «3 horas». */
export const formatHours = (hours: number): string =>
  `${formatNumber(hours)} ${hours === 1 ? 'hora' : 'horas'}`;
