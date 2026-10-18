/**
 * Rutas internas con el prefijo `base` de Astro. Hoy la web vive en la raíz del
 * dominio, pero si algún día se sirve en una subcarpeta, basta con cambiar `base`.
 */
export const withBase = (path = '') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};
