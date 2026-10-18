/**
 * Fotografías del sitio.
 *
 * Mientras `src` sea null se muestra un marcador "Foto pendiente" claramente
 * identificable. Para usar una foto real:
 *   1. Copia el archivo a src/assets/photos/ (JPG o WebP, idealmente ≥ 2000 px de ancho).
 *   2. Impórtalo arriba:  import grupo from '../assets/photos/grupo-conversacion.jpg';
 *   3. Asigna `src: grupo` y escribe un `alt` que describa lo que se ve.
 * Astro genera automáticamente versiones AVIF/WebP en varios tamaños.
 *
 * La galería acepta cualquier número de fotos y cualquier proporción: la
 * cuadrícula recorta con object-fit respetando `focus`.
 */
import type { ImageMetadata } from 'astro';

export type PhotoShape = 'landscape' | 'portrait' | 'square' | 'wide';

export type Photo = {
  id: string;
  src: ImageMetadata | null;
  /** Texto alternativo: describe lo que se ve, sin atribuir identidades ni resultados. */
  alt: string;
  /** Qué tipo de foto encaja en este hueco (solo se muestra en el marcador). */
  slot: string;
  /** Proporción del hueco (retrato y foto principal). En la galería la decide la cuadrícula. */
  shape?: PhotoShape;
  /** Punto focal para el recorte responsive (CSS object-position). */
  focus?: string;
  /** Pie de foto opcional. Déjalo vacío salvo que sea verificable. */
  caption?: string;
};

export const heroPhoto: Photo = {
  id: 'hero',
  src: null,
  alt: 'Daniel Guanipa durante una clase de inglés',
  slot: 'Daniel dando clase: explicando, conversando o guiando una actividad',
  shape: 'portrait',
  focus: '50% 35%',
};

export const portraitPhoto: Photo = {
  id: 'retrato',
  src: null,
  alt: 'Retrato de Daniel Guanipa',
  slot: 'Retrato profesional de Daniel, luz natural, fondo neutro',
  shape: 'portrait',
  focus: '50% 30%',
};

export const gallery: Photo[] = [
  {
    id: 'grupo',
    src: null,
    alt: 'Grupo reducido de alumnos participando en una actividad de clase',
    slot: 'Interacción en grupo: alumnos hablando o trabajando juntos',
  },
  {
    id: 'materiales',
    src: null,
    alt: 'Materiales didácticos preparados para una clase de inglés',
    slot: 'Materiales y recursos: fichas, libros, tarjetas',
  },
  {
    id: 'dinamica',
    src: null,
    alt: 'Juego de mesa utilizado como actividad de práctica en clase',
    slot: 'Dinámica o juego en clase',
  },
  {
    id: 'pizarra',
    src: null,
    alt: 'Explicación en la pizarra durante una clase',
    slot: 'Explicación en pizarra o pantalla',
  },
  {
    id: 'seguimiento',
    src: null,
    alt: 'Profesor revisando el trabajo de un alumno',
    slot: 'Atención individual o corrección',
  },
];
