import { expect, test } from '@playwright/test';

test('la frase de la marca aparece una sola vez y la firma «by Daniel Guanipa» solo en el pie', async ({ page }) => {
  await page.goto('/');
  const body = await page.locator('body').innerText();
  expect(body.match(/Aprender inglés empieza por entenderte/g) ?? []).toHaveLength(1);
  const html = await page.content();
  expect(html.match(/Aprender inglés empieza por entenderte/g) ?? []).toHaveLength(1);
  expect(await page.locator('.logo__signature').count()).toBe(1);
  await expect(page.locator('footer .logo__signature')).toHaveCount(1);
  // El texto alternativo describe lo que se ve, sin créditos de marca.
  const alts = await page.locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt') ?? ''));
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

test('datos destacados de «Sobre mí»: exactamente los cuatro indicados', async ({ page }) => {
  await page.goto('/');
  const items = page.locator('#sobre-mi .credential');
  await expect(items).toHaveCount(4);
  const text = (await items.allInnerTexts()).join('\n');
  expect(text).toContain('Inglés a nivel bilingüe');
  expect(text).toContain('Como profesor de inglés y matemáticas');
  expect(text).toContain('De retención de alumnos');
  expect(text).toContain('Conozco los errores típicos de los hispanohablantes');
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

test('las preguntas de ubicación y de precio de parejas están y usan los precios del motor', async ({ page }) => {
  await page.goto('/');
  const where = page.locator('#preguntas details', { hasText: '¿Dónde son las clases presenciales?' });
  await where.locator('summary').click();
  await expect(where).toContainText('Playa San Juan (Alicante), en tu casa o en un espacio tranquilo que acordemos. También online por videollamada.');
  const pairs = page.locator('#preguntas details', { hasText: '¿Hay precio para parejas?' });
  await pairs.locator('summary').click();
  await expect(pairs).toContainText(/Sí: 120\s€\/mes por persona en el plan Esencial y 180\s€\/mes por persona en el Intensivo\./);
});

test('las tarjetas de plan muestran el precio de parejas junto al individual y al de grupo', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cfg').scrollIntoViewIfNeeded();
  const esencial = page.getByRole('radio', { name: /Plan Esencial/ }).locator('xpath=ancestor::label');
  await expect(esencial).toContainText(/Individual: 180\s€ al mes/);
  await expect(esencial).toContainText(/En pareja: 120\s€ al mes por persona/);
  await expect(esencial).toContainText(/En grupo de 4: desde 84\s€/);
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
