import { describe, expect, it } from 'vitest';
import { isPending, visibleFaqs, visibleTestimonials, type Testimonial } from '../../src/lib/content';
import { testimonials, mostrarTestimonios } from '../../src/config/testimonials';
import { mostrarMarcadoresPendientes } from '../../src/config/policies';

const real: Testimonial = { text: 'Con Daniel por fin entendí los tiempos verbales.', author: 'Lucía, 17 años' };

describe('marcadores pendientes', () => {
  it('detecta cualquier texto entre corchetes', () => {
    expect(isPending('[24]')).toBe(true);
    expect(isPending('Mediante [Bizum o transferencia].')).toBe(true);
    expect(isPending('[TESTIMONIO 1: texto real del alumno]')).toBe(true);
    expect(isPending('Playa San Juan (Alicante)')).toBe(false);
    expect(isPending('Hasta 4 alumnos')).toBe(false);
  });
});

describe('testimonios', () => {
  it('con la bandera apagada no se muestra ninguno, ni siquiera los reales', () => {
    expect(visibleTestimonials([real], false, false)).toEqual([]);
    expect(visibleTestimonials([real], false, true)).toEqual([]);
  });

  it('con la bandera encendida solo se publican los reales', () => {
    const mixed = [real, { text: '[TESTIMONIO 2: texto real del alumno]', author: '[Nombre]' }, { text: 'Muy bien', author: '[Nombre]' }];
    expect(visibleTestimonials(mixed, true, false)).toEqual([real]);
  });

  it('si todos son marcadores, la sección queda vacía (y por tanto oculta)', () => {
    expect(visibleTestimonials(testimonials, true, false)).toEqual([]);
  });

  it('en revisión se ven los marcadores', () => {
    expect(visibleTestimonials(testimonials, true, true)).toHaveLength(3);
  });

  it('la configuración entregada tiene tres marcadores y la sección apagada', () => {
    expect(mostrarTestimonios).toBe(false);
    expect(testimonials).toHaveLength(3);
    expect(testimonials.every((t) => isPending(t.text) && isPending(t.author))).toBe(true);
  });
});

describe('preguntas con marcadores', () => {
  const faqs = [
    { q: '¿Dónde?', a: 'En Playa San Juan.' },
    { q: '¿Cómo se paga?', a: 'Mediante [Bizum o transferencia].' },
  ];
  it('se ocultan en producción y se ven en revisión', () => {
    expect(visibleFaqs(faqs, false).map((f) => f.q)).toEqual(['¿Dónde?']);
    expect(visibleFaqs(faqs, true)).toHaveLength(2);
  });
  it('la revisión está apagada por defecto en la web publicada', () => {
    expect(mostrarMarcadoresPendientes).toBe(false);
  });
});
