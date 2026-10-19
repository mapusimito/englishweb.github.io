import { FORMATS, type FormatId } from '../../config/pricing';
import { calculateQuote } from '../../lib/pricing/engine';
import { formatEuros } from '../../lib/pricing/format';
import { weeklyHoursOf, type FieldError, type WizardState } from '../../lib/configurator/state';
import { ChoiceCard, FieldErrorText, FreeLessonNote, errorFor } from './ui';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: FieldError[];
}

const COPY: Record<FormatId, { who: string; detail: string }> = {
  individual: { who: '1 alumno', detail: 'Clases privadas. Eres el único participante.' },
  pareja: { who: 'Exactamente 2 alumnos', detail: 'Vienes con tu propia pareja de estudio.' },
  grupo3: { who: 'Exactamente 3 alumnos', detail: 'Incluyéndote a ti. Vienes con tus propios compañeros.' },
  grupo4: { who: 'Exactamente 4 alumnos', detail: 'Incluyéndote a ti. Vienes con tus propios compañeros.' },
};

export function FormatStep({ state, update, errors }: Props) {
  const hours = weeklyHoursOf(state);
  const error = errorFor(errors, 'format');

  return (
    <div>
      <h3 class="cfg-title" id="cfg-title" tabIndex={-1}>
        ¿Con cuántas personas quieres dar clase?
      </h3>
      <p class="cfg-help">
        Las tarifas de grupo se aplican cuando vienes con tus propios compañeros. No asignamos automáticamente a
        personas que se inscriben individualmente a grupos de desconocidos.
      </p>

      <div
        role="radiogroup"
        aria-labelledby="cfg-title"
        aria-describedby={error ? 'format-error' : undefined}
        id="format"
        class="cfg-cards cfg-cards--formats"
      >
        {FORMATS.map((format) => {
          const quote = hours === null ? null : calculateQuote(format.students, hours);
          return (
            <ChoiceCard
              name="format"
              value={format.id}
              checked={state.formatId === format.id}
              onSelect={() => update({ formatId: format.id })}
            >
              <span class="cfg-card__name">{format.name}</span>
              <span class="cfg-card__who">{COPY[format.id].who}</span>
              <span class="cfg-card__text">{COPY[format.id].detail}</span>
              {quote && (
                <span class="cfg-card__price">
                  <span class="cfg-card__amount">{formatEuros(quote.monthlyPerStudentCents, true)}</span>
                  <span class="cfg-card__per">
                    {' '}
                    al mes{format.students > 1 ? ' por alumno' : ''}
                  </span>
                </span>
              )}
            </ChoiceCard>
          );
        })}
      </div>
      <FieldErrorText id="format-error" message={error} />
      <FreeLessonNote short />
    </div>
  );
}
