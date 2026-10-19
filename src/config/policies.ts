/**
 * Condiciones prácticas que aparecen en Preguntas frecuentes.
 *
 * Los valores entre [corchetes] están PENDIENTES de decidir. Mientras tengan
 * corchetes, la pregunta correspondiente no se publica en la web (en desarrollo
 * sí se ve, para poder revisarla). Para publicarla, sustituye el valor y quita
 * los corchetes: «[Bizum o transferencia]» → «Bizum».
 */

/** Medio de pago mensual. */
export const paymentMethod = '[Bizum o transferencia]'; // PENDIENTE

/** Horas de antelación mínimas para recuperar una clase a la que no se puede asistir. */
export const cancellationNoticeHours = '[24]'; // PENDIENTE

/** Dónde se dan las clases presenciales. */
export const inPersonPlace = 'Playa de San Juan';

/**
 * Pon esto en true para ver en la web publicada las preguntas y los testimonios
 * que todavía contienen marcadores [entre corchetes] (solo para revisarlos).
 */
export const mostrarMarcadoresPendientes = false;

/** En desarrollo (`npm run dev`) los marcadores siempre se ven. */
export const showPending: boolean = import.meta.env.DEV || mostrarMarcadoresPendientes;

/**
 * Datos del responsable en la política de privacidad y el aviso legal.
 * NIF/NIE y domicilio no se publican (decisión del titular).
 */
export const responsable = {
  nombre: 'Daniel Alejandro Guanipa Alvarez',
  email: 'dagamapu@gmail.com',
};
