import {
  HOURS_STEP,
  MIN_WEEKLY_HOURS,
  PLANS,
  SUGGESTED_CUSTOM_HOURS,
  type PlanId,
} from '../../config/pricing';
import { calculateQuote } from '../../lib/pricing/engine';
import { formatEuros, formatNumber } from '../../lib/pricing/format';
import { parseHours, type FieldError, type WizardState } from '../../lib/configurator/state';
import { ChoiceCard, FieldErrorText, FreeLessonNote, errorFor } from './ui';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: FieldError[];
}

/** Precios de partida de cada tarjeta: los calcula el motor, no están escritos a mano. */
function priceHints(hours: number | null): string[] {
  if (hours === null) return ['El precio depende de las horas y del formato; lo verás antes de enviar nada.'];
  const monthly = (students: number) => formatEuros(calculateQuote(students, hours).monthlyPerStudentCents, true);
  return [
    `Individual: ${monthly(1)} al mes`,
    `En pareja: ${monthly(2)} al mes por persona`,
    `En grupo de 4: desde ${monthly(4)} al mes por alumno`,
  ];
}

const asInput = (hours: number) => formatNumber(hours);

export function PlanStep({ state, update, errors }: Props) {
  const parsed = parseHours(state.customHoursInput);
  const planError = errorFor(errors, 'plan');
  const hoursError = errorFor(errors, 'hours') ?? (state.customHoursInput.trim() ? parsed.error : null);
  const custom = state.planId === 'personalizado';

  const setHours = (hours: number) => update({ customHoursInput: asInput(hours) });
  const step = (delta: number) => {
    const current = parsed.value ?? (state.customHoursInput.trim() ? MIN_WEEKLY_HOURS : MIN_WEEKLY_HOURS - delta);
    setHours(Math.max(MIN_WEEKLY_HOURS, current + delta));
  };

  return (
    <div>
      <h3 class="cfg-title" id="cfg-title" tabIndex={-1}>
        Elige tu plan
      </h3>
      <p class="cfg-help">Los tres usan el mismo método. Cambia el tiempo que dedicas cada semana.</p>

      <div role="radiogroup" aria-labelledby="cfg-title" aria-describedby={planError ? 'plan-error' : undefined} id="plan" class="cfg-cards cfg-cards--plans">
        {PLANS.map((plan) => (
          <ChoiceCard
            name="plan"
            value={plan.id}
            checked={state.planId === plan.id}
            onSelect={() => update({ planId: plan.id as PlanId })}
            class="cfg-card--plan"
          >
            <span class="cfg-card__name">{plan.name}</span>
            <span class="cfg-hours">
              <span class="cfg-hours__number">{plan.hours === null ? 'Tú eliges' : `${plan.hours} h`}</span>
              {plan.hours !== null && <span class="cfg-hours__unit"> / semana</span>}
            </span>
            <span class="cfg-dots" aria-hidden="true">
              {Array.from({ length: plan.hours ?? MIN_WEEKLY_HOURS }, (_, i) => (
                <span class="cfg-dots__dot" key={i} />
              ))}
              {plan.hours === null && <span class="cfg-dots__more">+</span>}
            </span>
            <span class="cfg-card__tagline">{plan.tagline}</span>
            <span class="cfg-card__text">{plan.description}</span>
            <span class="cfg-card__hint">
              {priceHints(plan.hours).map((line) => (
                <span class="cfg-card__hint-line">{line}</span>
              ))}
            </span>
          </ChoiceCard>
        ))}
      </div>
      <FieldErrorText id="plan-error" message={planError} />

      {custom && (
        <div class="cfg-custom" id="hours" role="group" aria-labelledby="cfg-custom-title">
          <h4 class="cfg-subtitle" id="cfg-custom-title">
            ¿Cuántas horas a la semana?
          </h4>
          <div role="radiogroup" aria-label="Horas sugeridas" class="cfg-chips">
            {SUGGESTED_CUSTOM_HOURS.map((h) => (
              <label class="cfg-chip">
                <input
                  type="radio"
                  name="suggested-hours"
                  value={h}
                  checked={parsed.value === h}
                  onChange={() => setHours(h)}
                />
                <span>{formatNumber(h)} horas</span>
              </label>
            ))}
          </div>

          <label class="cfg-label" for="hours-input">
            O escribe las horas que necesitas
          </label>
          <div class="cfg-stepper">
            <button type="button" class="cfg-stepper__btn" aria-label="Reducir media hora" onClick={() => step(-HOURS_STEP)}>
              −
            </button>
            <input
              id="hours-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={state.customHoursInput}
              onInput={(e) => update({ customHoursInput: (e.target as HTMLInputElement).value })}
              aria-invalid={hoursError ? 'true' : 'false'}
              aria-describedby="hours-help hours-error"
            />
            <span class="cfg-stepper__unit" aria-hidden="true">
              horas / semana
            </span>
            <button type="button" class="cfg-stepper__btn" aria-label="Añadir media hora" onClick={() => step(HOURS_STEP)}>
              +
            </button>
          </div>
          <p class="cfg-help" id="hours-help">
            Mínimo {formatNumber(MIN_WEEKLY_HOURS)} horas, en tramos de {formatNumber(HOURS_STEP)}.
          </p>
          <div id="hours-error" aria-live="polite">
            {hoursError && <p class="cfg-error">{hoursError}</p>}
            {hoursError && parsed.suggestions.length > 0 && (
              <p class="cfg-suggestions">
                {parsed.suggestions.map((s) => (
                  <button type="button" class="btn btn--secondary btn--compact" onClick={() => setHours(s)}>
                    Usar {formatNumber(s)} horas
                  </button>
                ))}
              </p>
            )}
          </div>
        </div>
      )}

      <FreeLessonNote />
    </div>
  );
}
