import { expect, test } from '@playwright/test';

test('la frase de la marca aparece una sola vez y la firma «by Daniel Guanipa» solo en el pie', async ({ page }) => {
  await page.goto('/');
  const body = await page.locator('body').innerText();
  // La microcopy de la portada aparece una sola vez en el hero.
  await expect(page.locator('.hero__tagline')).toHaveText('Tu primera clase es gratis.');
  expect(body).not.toContain('Aprender inglés empieza por entenderte');
  expect(body.match(/by Daniel Guanipa/g) ?? []).toHaveLength(1);
  await expect(page.locator('footer')).toContainText('by Daniel Guanipa');
  // El texto alternativo describe lo que se ve, sin créditos de marca.
  const alts = await page.locator('img').evaluateAll((imgs) =>
    imgs.map((i) => i.getAttribute('alt') ?? '').filter((alt) => alt !== ''), // alt vacío = decorativa
  );
  expect(alts.length).toBeGreaterThan(0);
  for (const alt of alts) {
    expect(alt.length).toBeGreaterThan(15);
    expect(alt).not.toMatch(/My Way to English|by Daniel/i);
  }
});

test('«primera clase gratis» no se repite en Preguntas con las mismas palabras', async ({ page }) => {
  await page.goto('/');
  const faq = await page.locator('#preguntas').innerText();
  expect(faq).not.toContain('Tu primera clase es gratis');
  const plans = await page.locator('#planes').innerText();
  expect(plans).toContain('Tu primera clase es gratis');
});

test('«Sobre mí»: experiencia en cinco puntos y sin datos no verificables', async ({ page }) => {
  await page.goto('/');
  const items = page.locator('#sobre-mi .about__experience li');
  await expect(items).toHaveCount(5);
  await expect(page.locator('#sobre-mi')).toContainText('Más de dos años de experiencia dando clases de inglés y matemáticas.');
  await expect(page.locator('#sobre-mi .credential')).toHaveCount(0);
});

test('no se publican marcadores [entre corchetes] ni la sección de testimonios', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#testimonios')).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toMatch(/\[TESTIMONIO/);
  expect(html).not.toContain('[Bizum');
  expect(html).not.toMatch(/\[\s*(X|Y|24)\s*\]/);
  await expect(page.getByText('¿Cómo se paga?')).toHaveCount(0);
  await expect(page.getByText('¿Qué pasa si no puedo asistir a una clase?')).toHaveCount(0);
});

test('las preguntas de ubicación y descuentos están', async ({ page }) => {
  await page.goto('/');
  const where = page.locator('#preguntas details', { hasText: '¿Dónde se imparten las clases presenciales?' });
  await where.locator('summary').click();
  await expect(where).toContainText('Podemos organizar las clases en Playa de San Juan, en tu domicilio si acordamos esa opción');
  const discounts = page.locator('#preguntas details', { hasText: '¿Hay descuentos por contratar más horas?' });
  await expect(discounts).toHaveCount(1);
});

test('las tarjetas de plan muestran el precio de parejas junto al individual y al de grupo', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cfg').scrollIntoViewIfNeeded();
  const esencial = page.getByRole('radio', { name: /Plan Esencial/ }).locator('xpath=ancestor::label');
  await expect(esencial).toContainText(/Individual: 180\s€\/mes/);
  await expect(esencial).toContainText(/En pareja: 120\s€\/mes por persona/);
  await expect(esencial).toContainText(/Grupo de 3: 96\s€\/mes por persona/);
  await expect(esencial).toContainText(/Grupo de 4: 84\s€\/mes por persona/);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('Contacto muestra un enlace directo a WhatsApp visible y oculta el formulario', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('#contacto .form__nojs a[href^="https://wa.me/34614271142"]');
    await expect(link).toBeVisible();
    await expect(page.locator('#contacto form')).toBeHidden();
    // También hay un enlace visible en el texto de introducción de Contacto.
    await expect(page.locator('#contacto .contact__channels a[href^="https://wa.me/"]')).toBeVisible();
  });
  test('el configurador avisa y ofrece WhatsApp', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#planes noscript, #planes .plans__noscript').first()).toBeAttached();
  });
});

test('el isologo (isotipo + logotipo completo) es igual en cabecera, menú y pie', async ({ page }) => {
  await page.goto('/');
  for (const scope of ['header .header__inner .logo', 'footer .logo']) {
    const logo = page.locator(scope);
    await expect(logo).toHaveCount(1);
    await expect(logo.locator('.logo__mark')).toHaveCount(1);
    await expect(logo.locator('.logo__wordmark')).toContainText('My Way');
    await expect(logo.locator('.logo__wordmark')).toContainText('English');
    await expect(logo.locator('.visually-hidden')).toContainText('My Way to English');
  }
  // El menú móvil usa el mismo conjunto.
  await expect(page.locator('#menu-movil .logo .logo__mark')).toHaveCount(1);
  await expect(page.locator('#menu-movil .logo .logo__wordmark')).toHaveCount(1);
});

test('metadatos y eyebrow según el contenido aprobado', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Clases de inglés presenciales en Alicante u online | My Way to English');
  const meta = async (sel: string) => (await page.locator(sel).getAttribute('content')) ?? '';
  expect(await meta('meta[name="description"]')).toBe(
    'Clases de inglés individuales o en grupos de hasta 4. Un profesor que conoce tu progreso y ajusta las clases a lo que necesitáis. Presencial en Alicante u online.',
  );
  expect(await meta('meta[property="og:title"]')).toBe('Clases de inglés en grupos reducidos | My Way to English');
  expect(await meta('meta[property="og:description"]')).toBe(
    'Aprende inglés en clases individuales o en grupos reducidos, con seguimiento de tu progreso y un profesor que trabaja contigo semana a semana. Desde 3 horas semanales.',
  );
  await expect(page.locator('.hero .eyebrow')).toHaveText('Clases de inglés presenciales en Alicante u online');
});

test.describe('diferencial: clase personalizada frente a aula masificada', () => {
  test('el pitch está en el hero y en los metadatos', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Aprende inglés con un profesor que conoce tu progreso.');
    await expect(page.locator('.hero__lead')).toContainText('objetivos y dificultades');
    await expect(page.locator('.hero__more')).toContainText('hasta cuatro personas');
    const meta = async (sel: string) => (await page.locator(sel).getAttribute('content')) ?? '';
    expect((await page.title()).length).toBeLessThanOrEqual(75);
    expect((await meta('meta[name="description"]')).length).toBeLessThanOrEqual(170);
    expect(await meta('meta[name="twitter:title"]')).toBe(await meta('meta[property="og:title"]'));
  });

  test('la sección de comparación existe, es una lista semántica y enlaza a la primera clase gratis', async ({ page }) => {
    await page.goto('/');
    const sec = page.locator('section#diferencia');
    await expect(sec).toHaveCount(1);
    await expect(sec.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(sec).toHaveAttribute('aria-labelledby', 'compare-title');
    const rows = sec.getByRole('listitem');
    expect(await rows.count()).toBeGreaterThanOrEqual(5);
    for (const row of await rows.all()) {
      await expect(row.getByRole('heading', { level: 3 })).toHaveCount(1);
      await expect(row).toContainText('En una academia');
      await expect(row).toContainText('En mis clases');
    }
    // Reconoce lo bueno de una academia y no nombra ninguna.
    await expect(sec).toContainText('¿Para quién tienen sentido mis clases?');
    await expect(sec.getByRole('link', { name: /primera clase gratis/i })).toHaveAttribute('href', '#planes');
    // Va justo tras la franja de datos.
    const order = await page.locator('main section').evaluateAll((els) => els.map((e) => e.id || e.className));
    expect(order.indexOf('diferencia')).toBe(order.findIndex((x) => String(x).includes('facts')) + 1);
  });

  test('no usa coral', async ({ page }) => {
    await page.goto('/');
    const colors = await page.locator('section#diferencia, section#diferencia *').evaluateAll((els) =>
      els.flatMap((e) => {
        const c = getComputedStyle(e);
        return [c.color, c.backgroundColor, c.borderTopColor];
      }),
    );
    expect(colors).not.toContain('rgb(224, 89, 47)');
  });

  for (const width of [320, 375]) {
    test(`sin desbordamiento horizontal a ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.locator('section#diferencia').scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const inner = await page.locator('section#diferencia').evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(inner).toBeLessThanOrEqual(0);
    });
  }

  test('las frases clave no se repiten en otras secciones', async ({ page }) => {
    await page.goto('/');
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const html = await page.content();
    expect(body.match(/Aprende inglés con un profesor que conoce tu progreso/gi) ?? []).toHaveLength(1);
    expect(html).not.toMatch(/academia[s]? (como|de) [A-Z]/);
  });
});
