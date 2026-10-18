# Daniel Guanipa · Clases de inglés en Alicante

Web personal de una sola página, construida con [Astro](https://astro.build) como sitio estático
(HTML + CSS, con un poco de JavaScript para el menú móvil, las animaciones de aparición y el formulario).

## Uso

```bash
npm install
npm run dev       # desarrollo en http://localhost:4321
npm run build     # comprueba tipos y genera /dist
npm run preview   # sirve /dist en local
```

El contenido de `dist/` se puede publicar en cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, GitHub Pages…).

## Dónde cambiar cada cosa

| Qué | Archivo |
| --- | --- |
| Precios, horas y descripción de los planes | `src/config/site.ts` → `plans` |
| WhatsApp, teléfono, email, envío del formulario | `src/config/site.ts` → `contact` |
| Dominio, título y descripción SEO | `src/config/site.ts` → `site` |
| Fotografías (principal, retrato, galería) | `src/config/photos.ts` |
| Enlaces del menú | `src/config/nav.ts` |
| Colores, tipografía, espaciado | `src/styles/global.css` (variables en `:root`) |
| Textos de cada sección | `src/components/*.astro` |
| Política de privacidad | `src/pages/privacidad.astro` (**pendiente**) |

Al compilar, la consola lista los datos que siguen pendientes.

## Datos pendientes de configurar

- **WhatsApp** (`contact.whatsapp`): número internacional sin `+` ni espacios, p. ej. `34600000000`.
  Mientras esté vacío, los botones de WhatsApp se muestran como «Solicitar información» y llevan al formulario.
- **Envío del formulario** (`contact.formEndpoint`): ahora mismo no hay backend. Opciones:
  1. Un servicio de formularios (Formspree, Getform, Basin…): crea el formulario y pega aquí su URL.
     El sitio envía un `POST` con `FormData` y solo muestra «Solicitud enviada» si el servidor responde OK.
  2. Sin endpoint pero con WhatsApp: el formulario abre WhatsApp con el mensaje ya redactado.
  3. Sin endpoint ni WhatsApp pero con email: abre el programa de correo con el mensaje redactado.
  4. Sin nada configurado: el formulario valida, pero avisa claramente de que **no se ha enviado**.
- **Teléfono y email** (`contact.phone`, `contact.email`): opcionales; si se rellenan aparecen en Contacto y en el pie.
- **Dominio** (`site.url`): necesario para la URL canónica y la imagen de Open Graph.
- **Política de privacidad**: el formulario recoge datos personales, así que hay que sustituir
  `src/pages/privacidad.astro` por un texto definitivo antes de publicar.
- **Fotografías**: ver abajo.

## Fotografías

Cada hueco de foto está definido en `src/config/photos.ts`. Fotos actuales:

| Hueco | Archivo |
| --- | --- |
| Portada (hero) | `clase-grupo-reducido.jpg` |
| Sobre mí | `daniel-explicando-ventana.jpg` |
| Método | `daniel-explicando-gestos.jpg` |
| Galería | sin fotos todavía: la sección no se muestra hasta que haya al menos una |

En los huecos con `src: null` (portada, retrato, método) se muestra un marcador rayado «Foto pendiente».
En la galería, los huecos sin foto simplemente no se publican.

Para poner una foto real:

1. Copia el archivo a `src/assets/photos/` (JPG o WebP, idealmente de al menos 2000 px de ancho).
2. Impórtalo en `src/config/photos.ts`: `import grupo from '../assets/photos/grupo-conversacion.jpg';`
3. Asigna `src: grupo`, revisa el `alt` y, si hace falta, ajusta `focus` (p. ej. `'50% 30%'`) para controlar el recorte.

Astro genera automáticamente versiones AVIF y WebP en varios tamaños; el espacio de cada foto está
reservado, así que no hay saltos de diseño al cargar. La galería admite cualquier número de fotos
y cualquier proporción.

## Estructura

```
src/
  config/       datos centralizados (site, photos, nav)
  components/   una sección por componente + piezas reutilizables (PhotoFrame, Icon, WhatsAppButton…)
  layouts/      BaseLayout: <head>, metadatos, Open Graph, cabecera y pie
  pages/        index (home) y privacidad
  scripts/      formulario de contacto y animaciones de aparición
  styles/       tokens de diseño y estilos base
public/         favicon, imagen Open Graph, robots.txt
```
