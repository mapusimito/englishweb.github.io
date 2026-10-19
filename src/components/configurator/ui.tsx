/** Piezas de interfaz compartidas por las pantallas del configurador. */
import type { ComponentChildren } from 'preact';
import type { FieldError } from '../../lib/configurator/state';

export const errorFor = (errors: FieldError[], field: string) =>
  errors.find((e) => e.field === field)?.message;

interface CardProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  describedBy?: string;
  children: ComponentChildren;
  class?: string;
}

/** Tarjeta seleccionable: radio nativo oculto + cuerpo con estado visible (no solo color). */
export function ChoiceCard({ name, value, checked, onSelect, describedBy, children, class: className }: CardProps) {
  return (
    <label class={`cfg-card ${className ?? ''}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        aria-describedby={describedBy}
      />
      <span class="cfg-card__body">
        <span class="cfg-card__mark" aria-hidden="true" />
        {children}
      </span>
    </label>
  );
}

export function FieldErrorText({ id, message }: { id: string; message?: string }) {
  return (
    <p class="cfg-error" id={id}>
      {message}
    </p>
  );
}

/** Nota de la primera clase gratuita (texto exacto del encargo). */
export function FreeLessonNote({ short = false }: { short?: boolean }) {
  return (
    <p class="cfg-free">
      <span class="waypoint" aria-hidden="true" />
      <span>
        {short ? (
          <>
            <strong>Tu primera clase es gratis.</strong> Sin compromiso de mensualidad.
          </>
        ) : (
          <>
            <strong>Tu primera clase es gratis.</strong> Conoce mi metodología, cuéntame tus objetivos y
            descubre cómo podemos organizar tu aprendizaje antes de comprometerte con una mensualidad.
          </>
        )}
      </span>
    </p>
  );
}
