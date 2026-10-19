import { useState } from 'preact/hooks';
import { formatEuros, formatHours, formatPercent } from '../../lib/pricing/format';
import { LATER, buildWhatsAppMessage, buildWhatsAppUrl } from '../../lib/configurator/whatsapp';
import { summarize, type WizardState } from '../../lib/configurator/state';
import { FreeLessonNote } from './ui';

interface Props {
  state: WizardState;
  whatsapp: string;
  pricingTerms?: string;
}

type Feedback = { tone: 'info' | 'error'; text: string } | null;

export function QuoteStep({ state, whatsapp, pricingTerms }: Props) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const summary = summarize(state);

  if (!summary) {
    return (
      <div>
        <h3 class="cfg-title" id="cfg-title" tabIndex={-1}>
          Faltan datos
        </h3>
        <p class="cfg-help">Vuelve atrás para completar los pasos anteriores.</p>
      </div>
    );
  }

  const q = summary.quote;
  const message = buildWhatsAppMessage(summary);
  const hasSaving = q.savingPerStudentMonthlyCents > 0;
  const group = summary.students > 1;
  const approx = q.hourlyRateIsRounded ? '≈ ' : '';

  const requestPlan = () => {
    const link = buildWhatsAppUrl(message, whatsapp);
    if (!link.ok) {
      setFeedback({
        tone: 'error',
        text:
          link.reason === 'not-configured'
            ? 'El número de WhatsApp de esta web todavía no está configurado, así que no puedo abrir la conversación. Puedes copiar tu solicitud con el botón de abajo y enviármela por otro medio.'
            : 'El número de WhatsApp configurado en la web no es válido, así que no puedo abrir la conversación. Puedes copiar tu solicitud con el botón de abajo.',
      });
      return;
    }
    window.open(link.url, '_blank', 'noopener');
    setFeedback({
      tone: 'info',
      text: 'He abierto WhatsApp con tu mensaje ya escrito. Todavía no se ha enviado: revisa el texto y pulsa «Enviar» en WhatsApp para completar tu solicitud. Si no se ha abierto, comprueba que el navegador no haya bloqueado la ventana.',
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setFeedback({ tone: 'info', text: 'Mensaje copiado. Pégalo en la conversación para enviármelo.' });
    } catch {
      setFeedback({ tone: 'error', text: 'No he podido copiar el mensaje. Puedes seleccionarlo y copiarlo desde «Ver el mensaje».' });
    }
  };

  return (
    <div>
      <h3 class="cfg-title" id="cfg-title" tabIndex={-1}>
        Tu {summary.planName.toLowerCase()}
      </h3>
      <p class="cfg-help">Revisa tu propuesta. No se envía nada hasta que tú lo confirmes en WhatsApp.</p>

      <div class="cfg-quote">
        <div class="cfg-summary">
          <dl class="cfg-dl">
            <div>
              <dt>Plan</dt>
              <dd>{summary.planName}</dd>
            </div>
            <div>
              <dt>Horas</dt>
              <dd>
                {formatHours(summary.weeklyHours)} a la semana
                <span class="cfg-dl__note"> · unas {formatHours(q.monthlyHours)} al mes (estimado)</span>
              </dd>
            </div>
            <div>
              <dt>Sesiones</dt>
              <dd>{summary.distribution.label}</dd>
            </div>
            <div>
              <dt>Formato</dt>
              <dd>
                {summary.formatName}
                <span class="cfg-dl__note"> · {summary.students} {summary.students === 1 ? 'alumno' : 'alumnos'}</span>
              </dd>
            </div>
            <div>
              <dt>{summary.students === 1 ? 'Participante' : 'Participantes'}</dt>
              <dd>
                <ul class="cfg-people" role="list">
                  {summary.participants.map((p) => (
                    <li>
                      <strong>{p.name ?? <em>Nombre: {LATER}</em>}</strong>
                      {(p.level || p.age) && (
                        <span class="cfg-dl__note"> · {[p.level, p.age].filter(Boolean).join(' · ')}</span>
                      )}
                      <br />
                      <span class="cfg-dl__note">
                        {p.objectives === null
                          ? 'Mismos objetivos que el participante 1'
                          : p.objectives.length
                            ? p.objectives.join(', ')
                            : 'Objetivos sin indicar'}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>

        <aside class="cfg-price" aria-labelledby="price-title">
          <h4 class="cfg-subtitle" id="price-title">
            Tu propuesta
          </h4>
          <p class="cfg-price__rate">
            {hasSaving && (
              <>
                Tarifa de referencia: <s>{formatEuros(q.referenceRateCents)}/h</s>{' '}
                <span class="visually-hidden">(precio individual habitual)</span>
                <br />
              </>
            )}
            Tu tarifa: <strong>{approx}{formatEuros(q.finalHourlyRateRoundedCents)}/h</strong>
            {group ? ' por alumno' : ''}
          </p>
          <p class="cfg-price__main">
            <span class="cfg-price__amount">{formatEuros(q.monthlyPerStudentCents, true)}</span>
            <span class="cfg-price__per"> al mes{group ? ' por alumno' : ''}</span>
          </p>
          {group && (
            <p class="cfg-price__group">
              Coste total del grupo: <strong>{formatEuros(q.monthlyGroupCents, true)} al mes</strong>
            </p>
          )}
          {hasSaving ? (
            <p class="cfg-price__saving">
              <strong>
                Ahorras {formatEuros(q.savingPerStudentMonthlyCents, true)} al mes{group ? ' por alumno' : ''}
              </strong>
              <br />
              Ahorro efectivo del {formatPercent(q.savingPercent)} frente a la tarifa individual de referencia.
            </p>
          ) : (
            <p class="cfg-price__saving">Esta es la tarifa individual de referencia.</p>
          )}
          {(q.hoursDiscount > 0 || group) && (
            <ul class="cfg-price__why" role="list">
              {q.hoursDiscount > 0 && <li>Descuento por contratar más horas.</li>}
              {group && <li>Precio reducido por compartir las clases.</li>}
            </ul>
          )}
          {approx && (
            <p class="cfg-fine">
              La tarifa por hora está redondeada al céntimo; el precio mensual se calcula con la tarifa exacta.
            </p>
          )}
        </aside>
      </div>

      <FreeLessonNote />
      {pricingTerms ? <p class="cfg-fine">{pricingTerms}</p> : null}
      <p class="cfg-fine">
        Esta solicitud no confirma una matrícula ni garantiza disponibilidad en el horario deseado. Revisaremos tu
        propuesta y coordinaremos los siguientes pasos por WhatsApp.
      </p>

      <div class="cfg-send">
        <button type="button" class="btn btn--primary cfg-send__main" onClick={requestPlan}>
          Solicitar mi plan por WhatsApp
        </button>
        <button type="button" class="btn btn--secondary" onClick={copy}>
          Copiar mensaje
        </button>
      </div>
      <div aria-live="polite" id="send-feedback">
        {feedback && (
          <p class={`cfg-feedback cfg-feedback--${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : undefined}>
            {feedback.text}
          </p>
        )}
      </div>
      <details class="cfg-message">
        <summary>Ver el mensaje que se enviará</summary>
        <pre>{message}</pre>
      </details>
    </div>
  );
}
