/**
 * Datos destacados de «Sobre mí». Solo lo que Daniel ha confirmado: no se añaden
 * títulos, certificaciones ni cifras que no estén en esta lista.
 */
export interface Credential {
  /** Texto grande y corto. */
  value: string;
  /** Cómo se lee en voz alta, si difiere del texto visible (p. ej. «+2 años»). */
  spoken?: string;
  label: string;
}

export const credentials: Credential[] = [
  { value: 'Bilingüe', label: 'Inglés a nivel bilingüe' },
  { value: '+2 años', spoken: 'Más de 2 años', label: 'Como profesor de inglés y matemáticas' },
  { value: '100 %', spoken: '100 por ciento', label: 'De retención de alumnos' },
  {
    value: 'Español nativo',
    label: 'Conozco los errores típicos de los hispanohablantes',
  },
];
