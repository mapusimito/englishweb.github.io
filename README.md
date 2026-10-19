# My Way to English · by Daniel Guanipa

Web de una sola página de **My Way to English**, la práctica de clases de inglés de Daniel Guanipa
en Alicante y online. Construida con [Astro](https://astro.build) como sitio estático, siguiendo el
*Brand Strategy & Visual Identity Brief v1.0* (2026-10-18).

## Uso

```bash
npm install
npm run dev       # desarrollo en http://localhost:4321
npm run build     # comprueba tipos y genera /dist
npm run preview   # sirve /dist en local
```

## Publicación (Vercel)

La web está publicada en **https://englishweb-mu.vercel.app**. Vercel está conectado al
repositorio de GitHub: cada push a `main` publica una nueva versión y cada pull request recibe
una URL de vista previa. No hay que configurar nada más.

Si añades un dominio propio en Vercel, cambia `site.url` en `src/config/site.ts`
(la URL canónica ya sigue automáticamente al dominio de producción del proyecto).

## Dónde cambiar cada cosa

| Qué | Archivo |
| --- | --- |
| Tokens de diseño (colores, tipografía, espacios, radios) | `src/styles/tokens.css` — copia literal del brief §14, **no añadir valores fuera de él** |
| Fuentes autoalojadas (Inter y Bricolage Grotesque, latin + latin-ext) | `src/styles/fonts/`, `src/styles/fonts.css` |
| Precios, planes, datos verificables, tagline, título y descripción | `src/config/site.ts` |
| Nota de impuestos / facturación bajo los precios | `src/config/site.ts` → `pricingTerms` (**pendiente**) |
| WhatsApp, teléfono, email, envío del formulario | `src/config/site.ts` → `contact` |
| Fotografías (portada, biografía, galería) | `src/config/photos.ts` |
| Fases del método (Diagnóstico, Diseño, Adaptación, Consolidación) | `src/config/approach.ts` |
| Enlaces del menú | `src/config/nav.ts` |
| Logotipo en texto vivo y símbolo Route Mark | `src/components/Logo.astro`, `src/components/RouteMark.astro`, `public/favicon.svg` |
| Textos de cada sección | `src/components/*.astro` |
| Política de privacidad y aviso legal | `src/pages/privacidad.astro`, `src/pages/aviso-legal.astro` (**pendientes**) |

Al compilar, la consola lista los datos de contacto que siguen pendientes.

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
- **Dominio propio** (opcional): ahora se usa `englishweb-mu.vercel.app`; ver «Publicación».
- **Decisiones de negocio del brief (§19)**: niveles que se ofrecen, si la primera sesión es de pago,
  canal principal y tiempo de respuesta, impuestos y condiciones de pago, lugar de las clases
  presenciales, versión en inglés. La web no inventa respuestas: cuando las tengas, se añaden.
- **Logotipo vectorial (§7)**: el wordmark es texto vivo con la fuente de la marca; cuando exista el
  SVG definitivo, sustituye el contenido de `Logo.astro`.
- **Política de privacidad**: el formulario recoge datos personales, así que hay que sustituir
  `src/pages/privacidad.astro` por un texto definitivo antes de publicar.
- **Fotografías**: ver abajo.

## Fotografías

Cada hueco de foto está definido en `src/config/photos.ts`. Fotos actuales:

| Hueco | Archivo |
| --- | --- |
| Portada (4:5, esquina de giro abajo a la derecha) | `daniel-explicando-ventana.jpg` |
| Biografía (4:5, esquina de giro arriba a la izquierda) | `daniel-explicando-gestos.jpg` |
| «Cómo son las clases» | `clase-grupo-reducido.jpg` |

La galería solo publica fotos reales, con un pie que describe la actividad sin nombrar alumnos.
Con una sola foto se muestra junto al texto; con más, en mosaico. Antes de publicar a alumnos
identificables hace falta su consentimiento por escrito (y el de la familia si son menores).

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
