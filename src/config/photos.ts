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
 * La galería solo muestra las fotos que ya tienen `src`; si no hay ninguna, la
 * sección no aparece. Acepta cualquier número de fotos y cualquier proporción:
 * la cuadrícula recorta con object-fit respetando `focus`.
 */
import type { ImageMetadata } from 'astro';
import claseGrupo from '../assets/photos/clase-grupo-reducido.jpg';
import heroAlumnos from '../assets/photos/hero-alumnos-en-clase.webp';
import explicandoGestos from '../assets/photos/daniel-explicando-gestos.jpg';

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

/** Portada: alumnos en clase (foto libre de derechos, no es de Daniel), 4:5, esquina de giro abajo a la derecha. */
export const heroPhoto: Photo = {
  id: 'hero',
  src: heroAlumnos,
  alt: 'Estudiantes en un aula escribiendo en sus cuadernos mientras una alumna de pie sonríe con un libro en los brazos',
  slot: 'Alumnos en clase',
  shape: 'portrait',
  focus: '62% 40%',
};

/** Biografía: Daniel dando clase, 4:5, esquina de giro arriba a la izquierda. */
export const bioPhoto: Photo = {
  id: 'bio',
  src: explicandoGestos,
  alt: 'Daniel Guanipa explica algo con las manos durante una clase',
  slot: 'Daniel explicando en una mesa o pizarra',
  shape: 'portrait',
  focus: '48% 45%',
};

/**
 * «Cómo son las clases» (brief §13.5): solo fotos reales, con pie que describe
 * la actividad sin nombrar alumnos. Con menos de 4 fotos se muestran más grandes.
 */
export const gallery: Photo[] = [
  {
    id: 'grupo',
    src: claseGrupo,
    alt: 'Daniel de pie junto a la mesa, dando clase a un grupo de tres alumnos',
    slot: 'Interacción en grupo: alumnos hablando o trabajando juntos',
    caption: 'Clase en grupo reducido, trabajando en torno a la mesa.',
    focus: '50% 45%',
  },
];
