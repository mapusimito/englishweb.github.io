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
import explicandoVentana from '../assets/photos/daniel-explicando-ventana.jpg';
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

export const heroPhoto: Photo = {
  id: 'hero',
  src: claseGrupo,
  alt: 'Daniel Guanipa, de pie junto a la mesa, dando clase a un grupo reducido de tres alumnos',
  slot: 'Daniel dando clase: explicando, conversando o guiando una actividad',
  shape: 'portrait',
  focus: '50% 40%',
};

export const portraitPhoto: Photo = {
  id: 'retrato',
  src: explicandoVentana,
  alt: 'Daniel Guanipa sonriendo mientras explica junto a una ventana',
  slot: 'Retrato profesional de Daniel, luz natural, fondo neutro',
  shape: 'portrait',
  focus: '45% 40%',
};

/** Foto junto a la explicación del enfoque («Mi enfoque»). */
export const approachPhoto: Photo = {
  id: 'enfoque',
  src: explicandoGestos,
  alt: 'Daniel Guanipa explicando con gestos durante una clase',
  slot: 'Daniel explicando o guiando una actividad',
  shape: 'portrait',
  focus: '48% 55%',
};

/*
 * Huecos opcionales: solo se muestran cuando tienen `src`. Si están vacíos,
 * la sección se maqueta sin foto, así que añadirlos no requiere rediseño.
 */

/** Junto a las cuatro fases del método: recursos o una actividad en marcha. */
export const methodPhoto: Photo = {
  id: 'metodo-recursos',
  src: null,
  alt: 'Materiales y recursos preparados para una actividad de clase',
  slot: 'Recursos o actividad en marcha: fichas, juegos, pizarra',
  shape: 'landscape',
};

/** Junto a la comparación entre clases individuales y en grupo. */
export const formatsPhoto: Photo = {
  id: 'formatos',
  src: null,
  alt: 'Alumnos conversando durante una actividad en grupo reducido',
  slot: 'Interacción entre alumnos en pareja o grupo reducido',
  shape: 'landscape',
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
