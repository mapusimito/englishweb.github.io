import {
  AGE_RANGES,
  LEVELS,
  OBJECTIVES,
  studentsOf,
  type FieldError,
  type ObjectiveId,
  type Participant,
  type WizardState,
} from '../../lib/configurator/state';
import { FieldErrorText, errorFor } from './ui';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: FieldError[];
}

function Objectives({
  index,
  participant,
  errors,
  onChange,
}: {
  index: number;
  participant: Participant;
  errors: FieldError[];
  onChange: (patch: Partial<Participant>) => void;
}) {
  const groupError = errorFor(errors, `p${index}-objectives`);
  const otherError = errorFor(errors, `p${index}-other`);
  const toggle = (id: ObjectiveId) =>
    onChange({
      objectives: participant.objectives.includes(id)
        ? participant.objectives.filter((o) => o !== id)
        : [...participant.objectives, id],
    });

  return (
    <div class="cfg-field">
      <p class="cfg-label" id={`p${index}-objectives-label`}>
        {index === 0 ? '¿Qué quieres conseguir con el inglés?' : '¿Qué quiere conseguir?'}{' '}
        <span class="cfg-hint">{index === 0 ? '(elige todos los que quieras)' : '(opcional)'}</span>
      </p>
      <div
        role="group"
        aria-labelledby={`p${index}-objectives-label`}
        aria-describedby={groupError ? `p${index}-objectives-error` : undefined}
        id={`p${index}-objectives`}
        class="cfg-checks"
      >
        {OBJECTIVES.map((o) => (
          <label class="cfg-check">
            <input type="checkbox" checked={participant.objectives.includes(o.id)} onChange={() => toggle(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <FieldErrorText id={`p${index}-objectives-error`} message={groupError} />
      {participant.objectives.includes('otro') && (
        <div class="cfg-field">
          <label class="cfg-label" for={`p${index}-other`}>
            ¿Cuál es el otro objetivo?
          </label>
          <input
            id={`p${index}-other`}
            type="text"
            value={participant.otherObjective}
            maxLength={160}
            onInput={(e) => onChange({ otherObjective: (e.target as HTMLInputElement).value })}
            aria-invalid={otherError ? 'true' : 'false'}
            aria-describedby={`p${index}-other-error`}
          />
          <FieldErrorText id={`p${index}-other-error`} message={otherError} />
        </div>
      )}
    </div>
  );
}

export function ParticipantsStep({ state, update, errors }: Props) {
  const count = studentsOf(state.formatId) ?? 1;
  const change = (index: number, patch: Partial<Participant>) =>
    update({ participants: state.participants.map((p, i) => (i === index ? { ...p, ...patch } : p)) });

  return (
    <div>
      <h3 class="cfg-title" id="cfg-title" tabIndex={-1}>
        {count === 1 ? 'Cuéntame sobre ti' : `Cuéntame quién va a asistir (${count} personas)`}
      </h3>
      <p class="cfg-help">
        Solo pido lo necesario para preparar tu propuesta. Si no conoces algún dato, puedes indicarlo más tarde.
      </p>

      <div class="cfg-participants">
        {state.participants.slice(0, count).map((p, i) => {
          const nameError = errorFor(errors, `p${i}-name`);
          const ownObjectives = i === 0 || !p.sameObjectives;
          return (
            <fieldset class="cfg-participant" key={i}>
              <legend class="cfg-participant__legend">
                {i === 0 ? (count === 1 ? 'Tus datos' : 'Participante 1 (tú)') : `Participante ${i + 1}`}
              </legend>

              <div class="cfg-field">
                <label class="cfg-label" for={`p${i}-name`}>
                  Nombre completo
                </label>
                <input
                  id={`p${i}-name`}
                  type="text"
                  value={p.name}
                  maxLength={80}
                  autoComplete={i === 0 ? 'name' : 'off'}
                  disabled={i > 0 && p.nameLater}
                  onInput={(e) => change(i, { name: (e.target as HTMLInputElement).value })}
                  aria-invalid={nameError ? 'true' : 'false'}
                  aria-describedby={`p${i}-name-error`}
                />
                <FieldErrorText id={`p${i}-name-error`} message={nameError} />
                {i > 0 && (
                  <label class="cfg-check">
                    <input type="checkbox" checked={p.nameLater} onChange={() => change(i, { nameLater: !p.nameLater })} />
                    <span>Indicaré su nombre más tarde</span>
                  </label>
                )}
              </div>

              <div class="cfg-row">
                <div class="cfg-field">
                  <label class="cfg-label" for={`p${i}-age`}>
                    Edad <span class="cfg-hint">(opcional)</span>
                  </label>
                  <select id={`p${i}-age`} value={p.age} onChange={(e) => change(i, { age: (e.target as HTMLSelectElement).value })}>
                    <option value="">Prefiero no indicarlo</option>
                    {AGE_RANGES.map((a) => (
                      <option value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div class="cfg-field">
                  <label class="cfg-label" for={`p${i}-level`}>
                    Nivel actual de inglés <span class="cfg-hint">(opcional)</span>
                  </label>
                  <select id={`p${i}-level`} value={p.level} onChange={(e) => change(i, { level: (e.target as HTMLSelectElement).value })}>
                    <option value="">Sin indicar</option>
                    {LEVELS.map((l) => (
                      <option value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {i > 0 && (
                <label class="cfg-check">
                  <input
                    type="checkbox"
                    checked={p.sameObjectives}
                    onChange={() => change(i, { sameObjectives: !p.sameObjectives })}
                  />
                  <span>Tiene los mismos objetivos que el participante 1</span>
                </label>
              )}
              {ownObjectives && <Objectives index={i} participant={p} errors={errors} onChange={(patch) => change(i, patch)} />}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
