/**
 * Validación y envío del formulario de contacto.
 *
 * Canales (definidos en src/config/site.ts, por orden de preferencia):
 *  - endpoint: POST con FormData. Solo se muestra éxito si el servidor responde OK.
 *  - whatsapp: abre WhatsApp con el mensaje redactado; el usuario lo envía.
 *  - email:    abre el cliente de correo con el mensaje redactado.
 *  - none:     no hay canal; se informa de que no se ha enviado nada.
 */

type Channel = 'endpoint' | 'whatsapp' | 'email' | 'none';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{9,20}$/;

const validators: Record<string, (form: HTMLFormElement) => string> = {
  nombre: (form) => {
    const value = (form.elements.namedItem('nombre') as HTMLInputElement).value.trim();
    if (!value) return 'Escribe tu nombre.';
    if (value.length < 2) return 'El nombre parece demasiado corto.';
    return '';
  },
  contacto: (form) => {
    const value = (form.elements.namedItem('contacto') as HTMLInputElement).value.trim();
    if (!value) return 'Indica un teléfono o un email para poder responderte.';
    const digits = value.replace(/\D/g, '');
    if (value.includes('@')) {
      return EMAIL_RE.test(value) ? '' : 'Revisa el email: parece que le falta algo (ej.: nombre@correo.com).';
    }
    if (PHONE_RE.test(value) && digits.length >= 9) return '';
    return 'Escribe un teléfono (mínimo 9 dígitos) o un email válido.';
  },
  objetivos: (form) => {
    const value = (form.elements.namedItem('objetivos') as HTMLTextAreaElement).value.trim();
    if (!value) return 'Cuéntame brevemente qué te gustaría conseguir.';
    if (value.length < 10) return 'Añade un poco más de detalle (al menos 10 caracteres).';
    return '';
  },
  privacidad: (form) =>
    (form.elements.namedItem('privacidad') as HTMLInputElement).checked
      ? ''
      : 'Debes aceptar la política de privacidad para continuar.',
};

function setError(form: HTMLFormElement, name: string, message: string) {
  const field = form.elements.namedItem(name) as HTMLInputElement | null;
  const error = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

function validate(form: HTMLFormElement) {
  const invalid: string[] = [];
  for (const [name, check] of Object.entries(validators)) {
    const message = check(form);
    setError(form, name, message);
    if (message) invalid.push(name);
  }
  return invalid;
}

function buildMessage(data: FormData) {
  const get = (key: string) => String(data.get(key) ?? '').trim();
  return [
    'Hola, Daniel. Me gustaría recibir información sobre tus clases de inglés.',
    '',
    `Nombre: ${get('nombre')}`,
    `Contacto: ${get('contacto')}`,
    `Clases: ${get('alumno')}`,
    `Formato preferido: ${get('formato')}`,
    `Objetivos: ${get('objetivos')}`,
  ].join('\n');
}

function showStatus(form: HTMLFormElement, tone: 'success' | 'info' | 'error', title: string, body: string) {
  const status = form.querySelector<HTMLElement>('[data-status]');
  if (!status) return;
  status.dataset.tone = tone;
  status.innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = title;
  const p = document.createElement('span');
  p.textContent = body;
  status.append(strong, p);
  status.hidden = false;
  status.focus({ preventScroll: true });
  status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;

  const channel = (form.dataset.channel ?? 'none') as Channel;
  const summary = form.querySelector<HTMLElement>('[data-error-summary]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  let attempted = false;

  // Revalidar en vivo tras el primer intento, para que los errores desaparezcan al corregir.
  form.addEventListener('input', (event) => {
    if (!attempted) return;
    const name = (event.target as HTMLInputElement).name;
    if (validators[name]) setError(form, name, validators[name](form));
  });
  form.addEventListener('change', (event) => {
    if (!attempted) return;
    const name = (event.target as HTMLInputElement).name;
    if (validators[name]) setError(form, name, validators[name](form));
  });

  // Los botones "Consultar disponibilidad" de cada plan preseleccionan el formato.
  document.querySelectorAll<HTMLAnchorElement>('a[data-plan]').forEach((link) => {
    link.addEventListener('click', () => {
      const option = form.querySelector<HTMLInputElement>(`[data-plan-option="${link.dataset.plan}"]`);
      if (option) option.checked = true;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    attempted = true;

    const invalid = validate(form);
    if (invalid.length) {
      if (summary) summary.hidden = false;
      (form.elements.namedItem(invalid[0]) as HTMLElement | null)?.focus();
      return;
    }
    if (summary) summary.hidden = true;

    const data = new FormData(form);
    // Campo trampa relleno: probablemente un bot. No se envía nada.
    if (String(data.get('website') ?? '')) return;
    data.delete('website');

    if (channel === 'endpoint') {
      const original = submitLabel?.textContent ?? '';
      if (submit) submit.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Enviando…';
      try {
        const response = await fetch(form.dataset.endpoint!, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        attempted = false;
        showStatus(
          form,
          'success',
          'Solicitud enviada. ¡Gracias!',
          'He recibido tu mensaje y te responderé lo antes posible por el medio que has indicado.',
        );
      } catch {
        showStatus(
          form,
          'error',
          'No se ha podido enviar la solicitud.',
          'Comprueba tu conexión e inténtalo de nuevo en unos minutos. Tus datos siguen en el formulario.',
        );
      } finally {
        if (submit) submit.disabled = false;
        if (submitLabel) submitLabel.textContent = original;
      }
      return;
    }

    const message = buildMessage(data);

    if (channel === 'whatsapp') {
      const url = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener');
      showStatus(
        form,
        'info',
        'Hemos abierto WhatsApp con tu mensaje.',
        'Tu solicitud aún no se ha enviado: pulsa "Enviar" en WhatsApp para completarla. Si no se ha abierto, revisa si tu navegador ha bloqueado la ventana.',
      );
      return;
    }

    if (channel === 'email') {
      const subject = 'Información sobre clases de inglés';
      window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      showStatus(
        form,
        'info',
        'Hemos abierto tu programa de correo con el mensaje.',
        'Tu solicitud aún no se ha enviado: envía el email para completarla.',
      );
      return;
    }

    showStatus(
      form,
      'error',
      'Tu mensaje no se ha enviado.',
      'El formulario todavía no está conectado a ningún canal de envío. Mientras tanto, no es posible solicitar información desde esta web.',
    );
  });
}
