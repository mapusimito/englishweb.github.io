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

## Configurador de planes y motor de precios

La sección **Planes** es un asistente de cinco pantallas (plan → sesiones → formato → participantes →
presupuesto) que termina en un mensaje de WhatsApp. Está hecho con Preact como una «isla» de Astro: solo
se descarga cuando el visitante llega a esa sección.

**Los tres planes son tres entradas al mismo motor.** Esencial (3 h) e Intensivo (5 h) pasan sus horas
fijas; Personalizado pasa las que elige el cliente (mínimo 3, en tramos de 0,5, sin máximo arbitrario).
No existe lógica de precios separada por plan.

### Dónde está cada cosa

| Qué | Archivo |
| --- | --- |
| **Tarifas base por alumno/hora, escala de descuento por horas, planes, formatos, duraciones de sesión** | `src/config/pricing.ts` (**único sitio para cambiar precios**) |
| Motor de precios (cálculo y redondeo, funciones puras) | `src/lib/pricing/engine.ts` |
| Combinaciones de sesiones de 1 h / 1,5 h / 2 h | `src/lib/pricing/sessions.ts` |
| Formato de importes y porcentajes (es-ES) | `src/lib/pricing/format.ts` |
| Estado, validación por pantallas y resumen | `src/lib/configurator/state.ts` |
| Mensaje y enlace de WhatsApp | `src/lib/configurator/whatsapp.ts` |
| Interfaz del asistente | `src/components/configurator/*` |
| **Número de WhatsApp** | `src/config/site.ts` → `contact.whatsapp` (formato internacional, solo dígitos) |
| Nota de impuestos / condiciones de pago (opcional) | `src/config/site.ts` → `pricingTerms` |

### Reglas internas (no se muestran al cliente)

Con *n* alumnos y *h* horas semanales: `P_final = P_n · (1 − D_h)`, `M_alumno = 4 · h · P_final`,
`M_grupo = n · M_alumno`, `D_total = 1 − (1 − D_n)(1 − D_h)` con `D_n = 1 − P_n / 15 €`. El descuento por
horas se interpola linealmente entre los puntos de `HOURS_DISCOUNT_SCHEDULE` y se mantiene en el 20 % por
encima de 8 horas.

**Dinero y redondeo.** Todo se calcula en céntimos enteros. El precio mensual se calcula con la tarifa
*sin redondear* y se redondea **una sola vez** (mitades hacia arriba). El total del grupo es
`n × precio mensual por alumno ya redondeado`, así que siempre coincide con lo que se ve por alumno, y el
ahorro en euros es `referencia − precio`, calculado con importes ya redondeados. Si la tarifa por hora
mostrada está redondeada, la pantalla lo indica («≈»). La interfaz nunca contiene fórmulas.

### Pruebas

```bash
npm test            # unitarias (motor, sesiones, estado, WhatsApp) + flujo de la interfaz (Vitest)
npm run test:e2e    # navegador (Playwright + axe): responsive, teclado, WCAG 2.2 AA. Requiere npm run build
npm run test:all    # todo, en orden
```

`tests/unit/engine.test.ts` contiene la tabla de validación del encargo (11 combinaciones), verificada
de forma independiente con aritmética exacta de fracciones.

## Contenido pendiente de rellenar (marcadores [entre corchetes])

Los datos que decide el titular están marcados entre corchetes y **no se publican** hasta que se
rellenen: ni los testimonios ni las preguntas con corchetes aparecen en la web.

| Dónde | Qué falta |
| --- | --- |
| `src/config/testimonials.ts` | 3 testimonios reales con su autor, y poner `mostrarTestimonios = true`. Con permiso por escrito. |
| `src/config/policies.ts` → `paymentMethod` | Medio de pago: «[Bizum o transferencia]». Publica la pregunta «¿Cómo se paga?». |
| `src/config/policies.ts` → `cancellationNoticeHours` | Horas de antelación: «[24]». Publica «¿Qué pasa si no puedo asistir…?». |

Para **revisar** cómo quedan con los marcadores a la vista (sin publicarlos), usa `npm run dev` (siempre
se ven) o pon `mostrarMarcadoresPendientes = true` en `src/config/policies.ts`.

Los precios de pareja (preguntas y tarjetas de plan) no son marcadores: los calcula el motor de precios
(`src/config/pricing.ts`), para que nunca contradigan al configurador.

## Dónde cambiar cada cosa

| Qué | Archivo |
| --- | --- |
| Tokens de diseño (colores, tipografía, espacios, radios) | `src/styles/tokens.css` — copia literal del brief §14, **no añadir valores fuera de él** |
| Fuentes autoalojadas (Inter y Bricolage Grotesque, latin + latin-ext) | `src/styles/fonts/`, `src/styles/fonts.css` |
| Datos verificables, tagline, título y descripción | `src/config/site.ts` |
| Datos destacados de «Sobre mí» | `src/config/credentials.ts` |
| Pago, plazo de cancelación y lugar de las clases | `src/config/policies.ts` |
| WhatsApp, teléfono, email, envío del formulario | `src/config/site.ts` → `contact` |
| Fotografías (portada, biografía, galería) | `src/config/photos.ts` |
| Fases del método (Diagnóstico, Diseño, Adaptación, Consolidación) | `src/config/approach.ts` |
| Enlaces del menú | `src/config/nav.ts` |
| Isologo = isotipo mw2en + logotipo «My Way to English.» (igual en cabecera, menú, pie y OG) | `src/components/Logo.astro`; trazados del isotipo (de Daniel, sin modificar) en `src/config/logo.ts`; tamaño con `--wm-size`, colores con `--logo-mw` / `--logo-en` |
| Icono de pestaña/móvil e imagen para compartir | `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `og-image.png` |
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
