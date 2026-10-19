import { STEPS, type StepIndex } from '../../lib/configurator/state';

export function Progress({ step }: { step: StepIndex }) {
  return (
    <nav class="cfg-progress" aria-label="Progreso de tu presupuesto">
      <p class="cfg-progress__text">
        Paso {step + 1} de {STEPS.length} · <strong>{STEPS[step]}</strong>
      </p>
      <ol class="cfg-progress__list">
        {STEPS.map((label, i) => (
          <li
            class={`cfg-progress__item ${i < step ? 'is-done' : ''} ${i === step ? 'is-current' : ''}`}
            aria-current={i === step ? 'step' : undefined}
          >
            <span class="cfg-progress__dot" aria-hidden="true" />
            <span class="cfg-progress__label">
              {label}
              {i < step && <span class="visually-hidden"> (completado)</span>}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
