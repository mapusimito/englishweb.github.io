/**
 * Rutas internas con el prefijo `base` de Astro (GitHub Pages sirve la web en
 * /englishweb.github.io/). Úsalo para cualquier enlace o recurso que empiece por "/".
 */
export const withBase = (path = '') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};
