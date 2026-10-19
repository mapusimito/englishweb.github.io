/**
 * Configurador de planes: asistente de cinco pantallas (una a la vez) que termina
 * en un presupuesto y en un mensaje de WhatsApp. Los cálculos viven en
 * src/lib/pricing; aquí solo hay estado e interfaz.
 */
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import './configurator.css';
import {
  STEPS,
  initialState,
  normalize,
  validateStep,
  type FieldError,
  type StepIndex,
  type WizardState,
} from '../../lib/configurator/state';
import { DistributionStep } from './DistributionStep';
import { FormatStep } from './FormatStep';
import { ParticipantsStep } from './ParticipantsStep';
import { PlanStep } from './PlanStep';
import { Progress } from './Progress';
import { QuoteStep } from './QuoteStep';

interface Props {
  /** Número de WhatsApp en formato internacional (src/config/site.ts). Vacío = sin configurar. */
  whatsapp?: string;
  /** Nota de impuestos y condiciones de pago, si está definida (src/config/site.ts). */
  pricingTerms?: string;
}

const LAST = (STEPS.length - 1) as StepIndex;

export default function Configurator({ whatsapp = '', pricingTerms = '' }: Props) {
  const [state, setState] = useState<WizardState>(initialState);
  // Una vez que se intenta avanzar, los errores se recalculan en cada cambio y desaparecen al corregirlos.
  const [attempted, setAttempted] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Al cambiar de pantalla, el foco va al título del paso. Se hace justo tras pintar
  // (layout effect) para no competir con un campo en el que el usuario ya haya hecho clic.
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const heading = root.current?.querySelector<HTMLElement>('#cfg-title');
    heading?.focus({ preventScroll: true });
    const top = root.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight * 0.6) root.current?.scrollIntoView({ block: 'start' });
  }, [state.step]);

  const errors: FieldError[] = attempted ? validateStep(state, state.step) : [];

  // Tras un intento fallido, el foco va al resumen de errores (justo tras pintarlo).
  useLayoutEffect(() => {
    if (failedAttempts > 0) summary.current?.focus();
  }, [failedAttempts]);

  const update = (patch: Partial<WizardState>) => setState((s) => normalize({ ...s, ...patch }));
  const goTo = (step: StepIndex) => {
    setAttempted(false);
    setState((s) => ({ ...s, step }));
  };

  const next = () => {
    const found = validateStep(state, state.step);
    if (found.length) {
      setAttempted(true);
      setFailedAttempts((n) => n + 1);
      return;
    }
    goTo(Math.min(state.step + 1, LAST) as StepIndex);
  };
  const back = () => goTo(Math.max(state.step - 1, 0) as StepIndex);

  const focusField = (field: string) => {
    const el = root.current?.querySelector<HTMLElement>(`[id="${field}-input"], [id="${field}"]`);
    const target = el?.matches('input, select, textarea, button') ? el : el?.querySelector<HTMLElement>('input');
    target?.focus();
  };

  const stepProps = { state, update, errors };

  return (
    <div class="cfg" ref={root}>
      <Progress step={state.step} />

      {errors.length > 0 && (
        <div class="cfg-summary-errors" ref={summary} tabIndex={-1} role="alert">
          <p class="cfg-summary-errors__title">Revisa esto para continuar:</p>
          <ul>
            {errors.map((e) => (
              <li>
                <a
                  href={`#${e.field}`}
                  onClick={(ev) => {
                    ev.preventDefault();
                    focusField(e.field);
                  }}
                >
                  {e.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="cfg-step" key={state.step}>
        {state.step === 0 && <PlanStep {...stepProps} />}
        {state.step === 1 && <DistributionStep {...stepProps} goToHours={() => goTo(0)} />}
        {state.step === 2 && <FormatStep {...stepProps} />}
        {state.step === 3 && <ParticipantsStep {...stepProps} />}
        {state.step === 4 && <QuoteStep state={state} whatsapp={whatsapp} pricingTerms={pricingTerms} />}
      </div>

      <div class="cfg-nav">
        {state.step > 0 && (
          <button type="button" class="btn btn--secondary cfg-nav__back" onClick={back}>
            Volver
          </button>
        )}
        {state.step < LAST && (
          <button type="button" class="btn btn--primary cfg-nav__next" onClick={next}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
