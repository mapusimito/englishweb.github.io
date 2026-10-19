/**
 * Marcadores pendientes. Cualquier texto con [corchetes] es un dato que el titular
 * aún tiene que decidir o aportar. En producción esos textos NO se publican: la
 * pregunta o la tarjeta se oculta hasta que se rellene (o se activa la revisión en
 * src/config/policies.ts con `mostrarMarcadoresPendientes`).
 */

/** ¿Contiene un marcador pendiente entre corchetes, p. ej. «[24]» o «[TESTIMONIO 1: …]»? */
export const isPending = (text: string): boolean => /\[[^\]]+\]/.test(text);

export interface Testimonial {
  /** Texto literal del alumno o de su familia. */
  text: string;
  /** Quién lo dice: nombre, edad o «madre de alumno». */
  author: string;
}

/**
 * Testimonios a mostrar. Con `enabled` en false no se muestra nada. Con él en true
 * solo se publican los que ya son reales; los marcadores se enseñan únicamente
 * cuando `showPending` es true (desarrollo o revisión).
 */
export function visibleTestimonials(
  list: readonly Testimonial[],
  enabled: boolean,
  showPending: boolean,
): Testimonial[] {
  if (!enabled) return [];
  return showPending ? [...list] : list.filter((t) => !isPending(t.text) && !isPending(t.author));
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Preguntas a mostrar: las que aún contienen marcadores se ocultan salvo en revisión. */
export const visibleFaqs = (list: readonly FaqItem[], showPending: boolean): FaqItem[] =>
  showPending ? [...list] : list.filter((f) => !isPending(f.a) && !isPending(f.q));
