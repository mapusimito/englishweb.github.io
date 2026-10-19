/**
 * Testimonios de alumnos.
 *
 * IMPORTANTE: aquí solo debe haber testimonios REALES, con permiso por escrito de
 * quien los dio (o de su familia, si es menor). No se inventan.
 *
 * Para activar la sección:
 *   1. Sustituye cada marcador [entre corchetes] por el texto real y su autor.
 *   2. Pon `mostrarTestimonios = true`.
 * Mientras un testimonio siga siendo un marcador, no se publica; si ninguno es
 * real, la sección entera queda oculta.
 */
import type { Testimonial } from '../lib/content';

export const mostrarTestimonios = false;

export const testimonials: Testimonial[] = [
  {
    text: '[TESTIMONIO 1: texto real del alumno]',
    author: '[Nombre, edad o "madre de alumno"]',
  },
  {
    text: '[TESTIMONIO 2: texto real del alumno]',
    author: '[Nombre, edad o "madre de alumno"]',
  },
  {
    text: '[TESTIMONIO 3: texto real del alumno]',
    author: '[Nombre, edad o "madre de alumno"]',
  },
];
