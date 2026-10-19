import { SESSION_LENGTHS } from '../../config/pricing';
import { formatNumber } from '../../lib/pricing/format';
import { buildDistributions, type SessionDistribution } from '../../lib/pricing/sessions';
import { weeklyHoursOf, type FieldError, type WizardState } from '../../lib/configurator/state';
import { ChoiceCard, FieldErrorText, errorFor } from './ui';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: FieldError[];
  /** Vuelve a la primera pantalla para corregir las horas. */
  goToHours: () => void;
}

/** Dibujo de la semana: un bloque por sesión, con ancho proporcional a su duración. */
function SessionBlocks({ option }: { option: SessionDistribution }) {
  const blocks: number[] = [
    ...Array(option.twoHours).fill(2),
    ...Array(option.oneAndHalf).fill(1.5),
    ...Array(option.oneHour).fill(1),
  ];
  return (
    <span class="cfg-blocks" aria-hidden="true">
      {blocks.map((length, i) => (
        <span class="cfg-blocks__item" key={i} style={{ width: `calc(var(--space-5) * ${length * 1.4})` }} />
      ))}
    </span>
  );
}

export function DistributionStep({ state, update, errors, goToHours }: Props) {
  const hours = weeklyHoursOf(state);
  const result = hours === null ? null : buildDistributions(hours);
  const error = errorFor(errors, 'distribution');
  const lengths = SESSION_LENGTHS.map((l) => `${formatNumber(l)} h`).join(', ');

  return (
    <div>
      <h3 class="cfg-title" id="cfg-title" tabIndex={-1}>
        ¿Cómo quieres repartir tus {hours === null ? '' : `${formatNumber(hours)} `}horas semanales?
      </h3>
      <p class="cfg-help">
        Sesiones de {lengths}. Más adelante coordinamos los días y las horas; ahora solo necesito saber cómo
        prefieres dividir la semana.
      </p>

      {result && result.supported ? (
        <div
          role="radiogroup"
          aria-labelledby="cfg-title"
          aria-describedby={error ? 'distribution-error' : undefined}
          id="distribution"
          class="cfg-cards cfg-cards--list"
        >
          {result.options.map((option) => (
            <ChoiceCard
              name="distribution"
              value={option.id}
              checked={state.distributionId === option.id}
              onSelect={() => update({ distributionId: option.id })}
              class="cfg-card--row"
            >
              <span class="cfg-card__name">{option.label}</span>
              <span class="cfg-card__text">
                {option.sessions} {option.sessions === 1 ? 'sesión' : 'sesiones'} a la semana
              </span>
              <SessionBlocks option={option} />
            </ChoiceCard>
          ))}
        </div>
      ) : (
        <div class="cfg-notice" role="alert">
          <p>
            Con sesiones de {lengths} no se puede formar exactamente {hours === null ? 'esa cantidad' : `${formatNumber(hours)} horas`}.
            No voy a cambiar tu elección sin que lo decidas tú.
          </p>
          {result && result.suggestions.length > 0 && (
            <p class="cfg-suggestions">
              {result.suggestions.map((s) => (
                <button
                  type="button"
                  class="btn btn--secondary btn--compact"
                  onClick={() => {
                    update({ planId: 'personalizado', customHoursInput: formatNumber(s) });
                  }}
                >
                  Usar {formatNumber(s)} horas
                </button>
              ))}
            </p>
          )}
          <button type="button" class="btn btn--secondary btn--compact" onClick={goToHours}>
            Cambiar las horas
          </button>
        </div>
      )}
      <FieldErrorText id="distribution-error" message={error} />
    </div>
  );
}
