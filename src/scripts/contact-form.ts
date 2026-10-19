/**
 * Validación y envío del formulario de contacto (brief §13.7, §14.2).
 *
 * Validación en línea al salir de cada campo y resumen de errores al enviar.
 * Canales (definidos en src/config/site.ts, por orden de preferencia):
 *  - endpoint: POST con FormData. El mensaje de éxito sustituye al formulario
 *    solo si el servidor responde OK.
 *  - whatsapp: abre WhatsApp con el mensaje redactado; el usuario lo envía.
 *  - email:    abre el cliente de correo con el mensaje redactado.
 *  - none:     no hay canal; se informa de que no se ha enviado nada.
 */

type Channel = 'endpoint' | 'whatsapp' | 'email' | 'none';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{9,20}$/;

const value = (form: HTMLFormElement, name: string) =>
  ((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '').trim();

const validators: Record<string, { label: string; check: (form: HTMLFormElement) => string }> = {
  nombre: {
    label: 'Nombre',
    check: (form) => (value(form, 'nombre') ? '' : 'Escribe tu nombre.'),
  },
  contacto: {
    label: 'Email o teléfono',
    check: (form) => {
      const v = value(form, 'contacto');
      if (!v) return 'Indica un email o un teléfono para poder responderte.';
      if (v.includes('@')) return EMAIL_RE.test(v) ? '' : 'Revisa el email, por ejemplo: nombre@correo.com.';
      return PHONE_RE.test(v) && v.replace(/\D/g, '').length >= 9
        ? ''
        : 'Escribe un teléfono de al menos 9 dígitos o un email.';
    },
  },
  privacidad: {
    label: 'Política de privacidad',
    check: (form) =>
      (form.elements.namedItem('privacidad') as HTMLInputElement).checked
        ? ''
        : 'Para enviar el mensaje tienes que aceptar la política de privacidad.',
  },
};

function setError(form: HTMLFormElement, name: string, message: string) {
  const field = form.elements.namedItem(name) as HTMLInputElement | null;
  const error = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  field?.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

function buildMessage(data: FormData) {
  const get = (key: string) => String(data.get(key) ?? '').trim();
  const lines = [
    'Hola, Daniel. Me gustaría recibir información sobre tus clases de inglés.',
    '',
    `Nombre: ${get('nombre')}`,
    `Contacto: ${get('contacto')}`,
    `Clases: ${get('alumno')}`,
    `Formato: ${get('formato')}`,
    `Nivel aproximado: ${get('nivel')}`,
  ];
  if (get('objetivos')) lines.push(`Objetivos: ${get('objetivos')}`);
  if (get('mensaje')) lines.push(`Mensaje: ${get('mensaje')}`);
  return lines.join('\n');
}

function showStatus(form: HTMLFormElement, tone: 'info' | 'error', title: string, body: string) {
  const status = form.querySelector<HTMLElement>('[data-status]');
  if (!status) return;
  status.dataset.tone = tone;
  status.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = title;
  const text = document.createElement('span');
  text.textContent = body;
  status.append(strong, text);
  status.hidden = false;
  status.focus({ preventScroll: true });
  status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;

  const channel = (form.dataset.channel ?? 'none') as Channel;
  const summary = form.querySelector<HTMLElement>('[data-error-summary]');
  const summaryList = form.querySelector<HTMLElement>('[data-error-list]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const success = document.querySelector<HTMLElement>('[data-success]');

  // Validación en línea al salir de cada campo; después, también al corregir.
  const touched = new Set<string>();
  const revalidate = (event: Event) => {
    const name = (event.target as HTMLInputElement).name;
    if (!validators[name]) return;
    if (event.type === 'focusout') {
      touched.add(name);
      // Si el foco va al botón de enviar, no mostramos el error ahora: movería el
      // botón bajo el cursor y el clic se perdería. El envío valida todo igualmente.
      if ((event as FocusEvent).relatedTarget === submit) return;
    }
    if (touched.has(name)) setError(form, name, validators[name].check(form));
  };
  form.addEventListener('focusout', revalidate);
  form.addEventListener('input', revalidate);
  form.addEventListener('change', (event) => {
    touched.add((event.target as HTMLInputElement).name);
    revalidate(event);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const invalid = Object.entries(validators).filter(([name, { check }]) => {
      touched.add(name);
      const message = check(form);
      setError(form, name, message);
      return Boolean(message);
    });

    if (invalid.length) {
      if (summary && summaryList) {
        summaryList.replaceChildren(
          ...invalid.map(([name, { label }]) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            const field = form.elements.namedItem(name) as HTMLInputElement;
            a.href = `#${field.id}`;
            a.textContent = label;
            a.addEventListener('click', (e) => {
              e.preventDefault();
              field.focus();
            });
            li.append(a);
            return li;
          }),
        );
        summary.hidden = false;
        summary.focus();
      }
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
        // El mensaje de éxito sustituye al formulario y recibe el foco.
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }
      } catch {
        showStatus(
          form,
          'error',
          'No se ha podido enviar el mensaje.',
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
      window.open(`https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      showStatus(
        form,
        'info',
        'He abierto WhatsApp con tu mensaje.',
        'Todavía no se ha enviado: pulsa «Enviar» en WhatsApp para completarlo. Si no se ha abierto, revisa si el navegador ha bloqueado la ventana.',
      );
      return;
    }

    if (channel === 'email') {
      const subject = 'Información sobre clases de inglés';
      window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      showStatus(
        form,
        'info',
        'He abierto tu programa de correo con el mensaje.',
        'Todavía no se ha enviado: envía el email para completarlo.',
      );
      return;
    }

    showStatus(
      form,
      'error',
      'Tu mensaje no se ha enviado.',
      'El formulario todavía no está conectado a ningún canal de envío, así que por ahora no es posible escribirme desde aquí.',
    );
  });
}
