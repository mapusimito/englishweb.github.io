import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import Configurator from '../../src/components/configurator/Configurator';

const NBSP = String.fromCharCode(32);
let user: ReturnType<typeof userEvent.setup>;
let openSpy: MockInstance<typeof window.open>;

beforeEach(() => {
  user = userEvent.setup();
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
});
afterEach(() => vi.restoreAllMocks());

const next = () => user.click(screen.getByRole('button', { name: 'Siguiente' }));
const back = () => user.click(screen.getByRole('button', { name: 'Volver' }));
const pick = (name: RegExp | string) => user.click(screen.getByRole('radio', { name }));
const heading = () => screen.getByRole('heading', { level: 3 });
const stepText = () => screen.getByText(/Paso \d de 5/).textContent;

async function fillParticipant(index: number, name: string) {
  await user.type(document.getElementById(`p${index}-name`) as HTMLInputElement, name);
}

/** Recorre el asistente hasta el presupuesto. */
async function goToQuote(opts: { plan: RegExp; format: RegExp; people: string[]; hours?: string; distribution?: RegExp }) {
  await pick(opts.plan);
  if (opts.hours) {
    const input = screen.getByLabelText('O escribe las horas que necesitas');
    await user.clear(input);
    await user.type(input, opts.hours);
  }
  await next();
  if (opts.distribution) await pick(opts.distribution);
  else await user.click(screen.getAllByRole('radio')[0]);
  await next();
  await pick(opts.format);
  await next();
  for (let i = 0; i < opts.people.length; i++) await fillParticipant(i, opts.people[i]);
  await user.click(screen.getAllByRole('checkbox', { name: 'Conversación y fluidez' })[0]);
  await next();
}

describe('pantalla 1 · plan', () => {
  it('muestra los tres planes con sus horas y empieza en el paso 1 sin «Volver»', () => {
    render(<Configurator />);
    expect(stepText()).toBe('Paso 1 de 5 · Plan');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /Plan Esencial.*3 h/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Plan Intensivo.*5 h/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Plan Personalizado.*Tú eliges/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
    expect(screen.getByText(/Tu primera clase es gratis/)).toBeInTheDocument();
  });

  it('los precios de las tarjetas salen del motor', () => {
    render(<Configurator />);
    const esencial = screen.getByRole('radio', { name: /Plan Esencial/ });
    expect(esencial.closest('label')).toHaveTextContent(`Individual: 180${NBSP}€ al mes`);
    expect(esencial.closest('label')).toHaveTextContent(`En pareja: 120${NBSP}€ al mes por persona`);
    expect(esencial.closest('label')).toHaveTextContent(`desde 84${NBSP}€ al mes por alumno`);
    const intensivo = screen.getByRole('radio', { name: /Plan Intensivo/ }).closest('label');
    expect(intensivo).toHaveTextContent(`Individual: 270${NBSP}€ al mes`);
    expect(intensivo).toHaveTextContent(`En pareja: 180${NBSP}€ al mes por persona`);
    expect(intensivo).toHaveTextContent(`desde 126${NBSP}€`);
  });

  it('exige elegir un plan antes de continuar', async () => {
    render(<Configurator />);
    await next();
    expect(stepText()).toBe('Paso 1 de 5 · Plan');
    expect(screen.getAllByText('Elige un plan para continuar.').length).toBeGreaterThan(0);
    await pick(/Plan Esencial/);
    expect(screen.queryAllByText('Elige un plan para continuar.')).toHaveLength(0);
  });

  it('el selector de horas solo aparece con el plan personalizado', async () => {
    render(<Configurator />);
    expect(screen.queryByLabelText('O escribe las horas que necesitas')).not.toBeInTheDocument();
    await pick(/Plan Esencial/);
    expect(screen.queryByLabelText('O escribe las horas que necesitas')).not.toBeInTheDocument();
    await pick(/Plan Personalizado/);
    expect(screen.getByLabelText('O escribe las horas que necesitas')).toBeInTheDocument();
    for (const h of ['4 horas', '6 horas', '7 horas', '8 horas']) expect(screen.getByRole('radio', { name: h })).toBeInTheDocument();
  });
});

describe('plan personalizado · horas', () => {
  beforeEach(async () => {
    render(<Configurator />);
    await pick(/Plan Personalizado/);
  });
  const input = () => screen.getByLabelText('O escribe las horas que necesitas') as HTMLInputElement;

  it('no deja continuar sin horas, con menos de 3 o con valores no válidos', async () => {
    await next();
    expect(screen.getAllByText('Indica cuántas horas semanales quieres.').length).toBeGreaterThan(0);
    await user.type(input(), '2');
    expect(screen.getAllByText('El mínimo son 3 horas semanales.').length).toBeGreaterThan(0);
    await user.clear(input());
    await user.type(input(), 'mucho');
    expect(screen.getAllByText('Escribe un número, por ejemplo 4 o 4,5.').length).toBeGreaterThan(0);
  });

  it('propone alternativas sin cambiar las horas por su cuenta', async () => {
    await user.type(input(), '3,3');
    expect(screen.getByText(/¿Prefieres 3 h o 3,5 h\?/)).toBeInTheDocument();
    expect(input().value).toBe('3,3');
    await user.click(screen.getByRole('button', { name: 'Usar 3,5 horas' }));
    expect(input().value).toBe('3,5');
    expect(screen.queryByText(/¿Prefieres/)).not.toBeInTheDocument();
  });

  it('acepta horas fraccionarias y un valor sugerido', async () => {
    await user.type(input(), '5,5');
    await next();
    expect(heading()).toHaveTextContent('5,5 horas semanales');
    await back();
    await pick('7 horas');
    expect(input().value).toBe('7');
  });

  it('los botones + y − cambian de media en media hora y respetan el mínimo', async () => {
    await user.click(screen.getByRole('button', { name: 'Añadir media hora' }));
    expect(input().value).toBe('3');
    await user.click(screen.getByRole('button', { name: 'Añadir media hora' }));
    expect(input().value).toBe('3,5');
    await user.click(screen.getByRole('button', { name: 'Reducir media hora' }));
    await user.click(screen.getByRole('button', { name: 'Reducir media hora' }));
    expect(input().value).toBe('3');
  });

  it('admite valores altos sin máximo arbitrario', async () => {
    await user.type(input(), '12');
    await next();
    expect(heading()).toHaveTextContent('12 horas semanales');
  });
});

describe('pantalla 2 · reparto de sesiones', () => {
  it('Esencial ofrece las combinaciones de 3 horas', async () => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    expect(stepText()).toBe('Paso 2 de 5 · Sesiones');
    expect(heading()).toHaveTextContent('3 horas semanales');
    for (const label of ['3 sesiones de 1 hora', '2 sesiones de 1,5 horas', '1 sesión de 2 horas y 1 sesión de 1 hora']) {
      expect(screen.getByRole('radio', { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.queryByText(/lunes|martes|\d{1,2}:\d{2}/i)).not.toBeInTheDocument();
  });

  it('Intensivo ofrece las de 5 horas', async () => {
    render(<Configurator />);
    await pick(/Plan Intensivo/);
    await next();
    expect(screen.getByRole('radio', { name: /5 sesiones de 1 hora/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /2 sesiones de 2 horas y 1 sesión de 1 hora/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /2 sesiones de 1,5 horas y 2 sesiones de 1 hora/ })).toBeInTheDocument();
  });

  it('exige elegir una combinación', async () => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    await next();
    expect(stepText()).toBe('Paso 2 de 5 · Sesiones');
    expect(screen.getAllByText('Elige cómo quieres repartir las horas.').length).toBeGreaterThan(0);
  });

  it('si cambian las horas, la combinación anterior se descarta', async () => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    await pick(/2 sesiones de 1,5 horas/);
    await back();
    await pick(/Plan Intensivo/);
    await next();
    expect(screen.getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true);
  });

  it('si no cambian las horas, la elección se conserva al volver', async () => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    await pick(/2 sesiones de 1,5 horas/);
    await back();
    await next();
    expect(screen.getByRole('radio', { name: /2 sesiones de 1,5 horas/ })).toBeChecked();
  });
});

describe('pantalla 3 · formato', () => {
  async function toFormat() {
    render(<Configurator />);
    await pick(/Plan Intensivo/);
    await next();
    await pick(/5 sesiones de 1 hora/);
    await next();
  }

  it('muestra los cuatro formatos con el precio por alumno calculado por el motor', async () => {
    await toFormat();
    expect(stepText()).toBe('Paso 3 de 5 · Formato');
    const expected: Array<[RegExp, string]> = [
      [/Individual/, `270${NBSP}€`],
      [/En pareja/, `180${NBSP}€`],
      [/Grupo de 3/, `144${NBSP}€`],
      [/Grupo de 4/, `126${NBSP}€`],
    ];
    for (const [name, price] of expected) {
      expect(screen.getByRole('radio', { name }).closest('label')).toHaveTextContent(price);
    }
    expect(screen.getByText(/No asignamos automáticamente a personas/)).toBeInTheDocument();
  });

  it('exige elegir formato', async () => {
    await toFormat();
    await next();
    expect(stepText()).toBe('Paso 3 de 5 · Formato');
    expect(screen.getAllByText('Elige un formato para continuar.').length).toBeGreaterThan(0);
  });
});

describe('pantalla 4 · participantes', () => {
  const toParticipants = async (format: RegExp) => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    await pick(/3 sesiones de 1 hora/);
    await next();
    await pick(format);
    await next();
  };

  it.each([
    [/Individual/, 1],
    [/En pareja/, 2],
    [/Grupo de 3/, 3],
    [/Grupo de 4/, 4],
  ])('el formato %s muestra %i formulario(s)', async (format, count) => {
    await toParticipants(format);
    expect(stepText()).toBe('Paso 4 de 5 · Participantes');
    expect(document.querySelectorAll('fieldset.cfg-participant')).toHaveLength(count);
    expect(screen.getAllByLabelText('Nombre completo')).toHaveLength(count);
    // Los objetivos propios solo se piden al participante 1; los demás comparten por defecto.
    expect(screen.getAllByRole('group', { name: /¿Qué quieres conseguir/ })).toHaveLength(1);
  });

  it('pide nombre y objetivos del participante 1 con mensajes accesibles', async () => {
    await toParticipants(/Individual/);
    await next();
    expect(stepText()).toBe('Paso 4 de 5 · Participantes');
    const name = document.getElementById('p0-name')!;
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('p0-name-error')).toHaveTextContent('Escribe tu nombre completo.');
    expect(document.getElementById('p0-objectives-error')).toHaveTextContent('Elige al menos un objetivo.');
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa esto para continuar');
    // Con el nombre y un objetivo se puede avanzar.
    await fillParticipant(0, 'Ana');
    await user.click(screen.getByRole('checkbox', { name: 'Gramática' }));
    await next();
    expect(stepText()).toBe('Paso 5 de 5 · Presupuesto');
  });

  it('«Otro» pide describir el objetivo', async () => {
    await toParticipants(/Individual/);
    await fillParticipant(0, 'Ana');
    await user.click(screen.getByRole('checkbox', { name: 'Otro' }));
    await next();
    expect(document.getElementById('p0-other-error')).toHaveTextContent('Cuéntanos cuál es tu otro objetivo.');
    await user.type(document.getElementById('p0-other') as HTMLInputElement, 'Entrevistas');
    await next();
    expect(stepText()).toBe('Paso 5 de 5 · Presupuesto');
  });

  it('los demás participantes pueden dejar el nombre para más tarde', async () => {
    await toParticipants(/En pareja/);
    await fillParticipant(0, 'Ana');
    await user.click(screen.getByRole('checkbox', { name: 'Gramática' }));
    await next();
    expect(document.getElementById('p1-name-error')).toHaveTextContent('Escribe el nombre del participante 2');
    await user.click(screen.getByRole('checkbox', { name: 'Indicaré su nombre más tarde' }));
    expect(document.getElementById('p1-name')).toBeDisabled();
    await next();
    expect(stepText()).toBe('Paso 5 de 5 · Presupuesto');
    expect(screen.getAllByText(/Nombre: se indicará más tarde/).length).toBeGreaterThan(0);
  });

  it('cambiar de formato conserva los datos ya escritos', async () => {
    await toParticipants(/Grupo de 4/);
    await fillParticipant(0, 'Ana');
    await fillParticipant(3, 'Marta');
    await back();
    await pick(/En pareja/);
    await next();
    expect(document.querySelectorAll('fieldset.cfg-participant')).toHaveLength(2);
    expect((document.getElementById('p0-name') as HTMLInputElement).value).toBe('Ana');
    await back();
    await pick(/Grupo de 4/);
    await next();
    expect((document.getElementById('p3-name') as HTMLInputElement).value).toBe('Marta');
  });
});

describe('navegación', () => {
  it('«Volver» conserva todas las respuestas', async () => {
    render(<Configurator />);
    await goToQuote({
      plan: /Plan Intensivo/,
      format: /Grupo de 3/,
      people: ['Ana', 'Luis', 'Marta'],
      distribution: /5 sesiones de 1 hora/,
    });
    expect(stepText()).toBe('Paso 5 de 5 · Presupuesto');
    await back();
    expect((document.getElementById('p2-name') as HTMLInputElement).value).toBe('Marta');
    expect(screen.getAllByRole('checkbox', { name: 'Conversación y fluidez' })[0]).toBeChecked();
    await back();
    expect(screen.getByRole('radio', { name: /Grupo de 3/ })).toBeChecked();
    await back();
    expect(screen.getByRole('radio', { name: /5 sesiones de 1 hora/ })).toBeChecked();
    await back();
    expect(screen.getByRole('radio', { name: /Plan Intensivo/ })).toBeChecked();
  });

  it('el foco pasa al título de cada pantalla', async () => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    await waitFor(() => expect(heading()).toHaveFocus());
  });

  it('el indicador de progreso marca el paso actual', async () => {
    render(<Configurator />);
    await pick(/Plan Esencial/);
    await next();
    const current = document.querySelector('[aria-current="step"]')!;
    expect(current).toHaveTextContent('Sesiones');
  });
});

describe('pantalla 5 · presupuesto', () => {
  it('Intensivo para un grupo de 4: 126 € por alumno y 504 € en total', async () => {
    render(<Configurator />);
    await goToQuote({ plan: /Plan Intensivo/, format: /Grupo de 4/, people: ['Ana', 'Luis', 'Marta', 'Pedro'] });
    expect(heading()).toHaveTextContent('Tu plan intensivo');
    expect(screen.getByText(`126${NBSP}€`)).toBeInTheDocument();
    expect(screen.getAllByText(/al mes por alumno/).length).toBeGreaterThan(0);
    expect(screen.getByText(`504${NBSP}€ al mes`)).toBeInTheDocument();
    expect(screen.getAllByText(/Coste total del grupo/).length).toBeGreaterThan(0);
    expect(screen.getByText(`6,30${NBSP}€/h`)).toBeInTheDocument();
    expect(screen.getByText(`15,00${NBSP}€/h`)).toBeInTheDocument();
    expect(screen.getByText(`Ahorras 174${NBSP}€ al mes por alumno`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Ahorro efectivo del 58${NBSP}%`))).toBeInTheDocument();
    expect(screen.getByText(/20 horas al mes/)).toBeInTheDocument();
    expect(screen.getByText(/Tu primera clase es gratis/)).toBeInTheDocument();
    expect(screen.getAllByText(/no confirma una matrícula ni garantiza disponibilidad/).length).toBeGreaterThan(0);
    expect(screen.getByText('Descuento por contratar más horas.')).toBeInTheDocument();
    expect(screen.getByText('Precio reducido por compartir las clases.')).toBeInTheDocument();
  });

  it('Esencial individual: tarifa de referencia, sin ahorro ni total de grupo', async () => {
    render(<Configurator />);
    await goToQuote({ plan: /Plan Esencial/, format: /Individual/, people: ['Ana'] });
    expect(screen.getByText(`180${NBSP}€`)).toBeInTheDocument();
    expect(screen.queryByText(/Coste total del grupo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ahorras/)).not.toBeInTheDocument();
    expect(screen.getByText('Esta es la tarifa individual de referencia.')).toBeInTheDocument();
    expect(screen.queryByText('Descuento por contratar más horas.')).not.toBeInTheDocument();
  });

  it('Personalizado con 5,5 horas se calcula con 5,5 horas', async () => {
    render(<Configurator />);
    await goToQuote({ plan: /Plan Personalizado/, hours: '5,5', format: /Grupo de 4/, people: ['Ana', 'Luis', 'Marta', 'Pedro'] });
    expect(screen.getByText(`136,03${NBSP}€`)).toBeInTheDocument();
    expect(screen.getByText(/22 horas al mes/)).toBeInTheDocument();
    expect(screen.getByText(`544,12${NBSP}€ al mes`)).toBeInTheDocument();
  });

  it('no muestra fórmulas ni reglas internas', async () => {
    render(<Configurator />);
    await goToQuote({ plan: /Plan Intensivo/, format: /En pareja/, people: ['Ana', 'Luis'] });
    const text = document.body.textContent!.toLowerCase();
    for (const word of ['interpol', 'd_total', 'fórmula', 'umbral', 'tarifa base']) expect(text).not.toContain(word);
  });
});

describe('WhatsApp', () => {
  it('abre WhatsApp con el mensaje completo y nunca afirma que se haya enviado', async () => {
    render(<Configurator whatsapp="34600123456" />);
    await goToQuote({ plan: /Plan Intensivo/, format: /En pareja/, people: ['Ana López', 'Luis'] });
    await user.click(screen.getByRole('button', { name: 'Solicitar mi plan por WhatsApp' }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target, features] = openSpy.mock.calls[0] as unknown as [string, string, string];
    expect(url.startsWith('https://wa.me/34600123456?text=')).toBe(true);
    expect(target).toBe('_blank');
    expect(features).toBe('noopener');
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('Plan: Plan Intensivo');
    expect(text).toContain('1. Ana López');
    expect(text).toContain('Precio mensual por alumno: 180 €');
    expect(text).toContain('Coste total del grupo: 360 € al mes');
    expect(text).toContain('Primera clase gratis');
    expect(screen.getByText(/Todavía no se ha enviado/)).toBeInTheDocument();
  });

  it('sin número configurado muestra un error claro y no abre nada', async () => {
    render(<Configurator whatsapp="" />);
    await goToQuote({ plan: /Plan Esencial/, format: /Individual/, people: ['Ana'] });
    await user.click(screen.getByRole('button', { name: 'Solicitar mi plan por WhatsApp' }));
    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('todavía no está configurado');
  });

  it('permite ver y copiar el mensaje', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<Configurator whatsapp="34600123456" />);
    await goToQuote({ plan: /Plan Esencial/, format: /Individual/, people: ['Ana'] });
    expect(screen.getByText('Ver el mensaje que se enviará')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copiar mensaje' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Plan: Plan Esencial'));
    expect(screen.getByText(/Mensaje copiado/)).toBeInTheDocument();
  });
});
