import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: 'Siguiente' }).click();
const pick = (page: Page, name: RegExp | string) => page.getByRole('radio', { name }).check({ force: true });

async function openWizard(page: Page) {
  await page.goto('/');
  await page.locator('.cfg').scrollIntoViewIfNeeded();
  // La isla se hidrata al hacerse visible: se espera a que termine antes de interactuar.
  await expect(page.getByRole('radio', { name: /Plan Esencial/ })).toBeVisible();
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island');
    return island !== null && !island.hasAttribute('ssr');
  });
}

async function toQuote(page: Page) {
  await openWizard(page);
  await pick(page, /Plan Intensivo/);
  await next(page);
  await pick(page, /5 sesiones de 1 hora/);
  await next(page);
  await pick(page, /Grupo de 4/);
  await next(page);
  await page.locator('#p0-name').fill('Ana López');
  await page.getByRole('checkbox', { name: 'Conversación y fluidez' }).check({ force: true });
  for (const i of [1, 2, 3]) await page.locator(`#p${i}-name`).fill(`Compañero ${i}`);
  await next(page);
  await expect(page.getByRole('heading', { name: 'Tu plan intensivo' })).toBeVisible();
}

test('recorrido completo: de Intensivo para 4 al presupuesto con los importes correctos', async ({ page }) => {
  await toQuote(page);
  await expect(page.locator('.cfg-price__amount')).toHaveText(/126\s€/);
  await expect(page.locator('.cfg-price__group')).toContainText('504');
  await expect(page.locator('.cfg-price__saving')).toContainText('174');
  await expect(page.locator('.cfg-price__saving')).toContainText('58');
});

test('WhatsApp se abre con el número configurado y el mensaje completo', async ({ page, context }) => {
  await toQuote(page);
  // Se intercepta la apertura: no se navega a WhatsApp de verdad.
  await context.route('https://wa.me/**', (route) => route.fulfill({ status: 200, body: 'ok' }));
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Solicitar mi plan por WhatsApp' }).click();
  const popup = await popupPromise;
  const url = new URL(popup.url());
  expect(url.origin + url.pathname).toBe('https://wa.me/34614271142');
  const text = url.searchParams.get('text')!;
  expect(text).toContain('Plan: Plan Intensivo');
  expect(text).toContain('Coste total del grupo: 504 € al mes');
  await expect(page.getByText(/Todavía no se ha enviado/)).toBeVisible();
});

test('sin desbordamiento horizontal en ninguna pantalla', async ({ page }) => {
  await openWizard(page);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await pick(page, /Plan Personalizado/);
  await page.getByLabel('O escribe las horas que necesitas').fill('3,3');
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Usar 3,5 horas' }).click();
  await next(page);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.getByRole('radio').first().check({ force: true });
  await next(page);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await pick(page, /Grupo de 4/);
  await next(page);
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test('a 320 px no hay scroll horizontal ni en el presupuesto', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await toQuote(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test('se maneja con teclado y los objetivos táctiles miden al menos 44 px', async ({ page }) => {
  await openWizard(page);
  const radio = page.getByRole('radio', { name: /Plan Esencial/ });
  await radio.focus();
  await page.keyboard.press('Space');
  await expect(radio).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /Plan Intensivo/ })).toBeChecked();
  const nextBox = await page.getByRole('button', { name: 'Siguiente' }).boundingBox();
  expect(nextBox!.height).toBeGreaterThanOrEqual(44);
  await pick(page, /Plan Personalizado/);
  for (const name of ['Añadir media hora', 'Reducir media hora']) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('con movimiento reducido no hay animación al cambiar de pantalla', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWizard(page);
  await pick(page, /Plan Esencial/);
  await next(page);
  const duration = await page.locator('.cfg-step').evaluate((el) => getComputedStyle(el).animationDuration);
  expect(['0s', '0ms']).toContain(duration);
});

test.describe('accesibilidad (axe, WCAG 2.2 AA)', () => {
  const scan = async (page: Page) => {
    // Sin esperar a que acaben las animaciones de entrada, axe mediría colores a media opacidad.
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
    const results = await new AxeBuilder({ page })
      .include('.cfg')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  };

  test('pantallas 1 a 5, también con errores visibles', async ({ page }) => {
    await openWizard(page);
    await scan(page);
    await pick(page, /Plan Personalizado/);
    await page.getByLabel('O escribe las horas que necesitas').fill('3,3');
    await scan(page);
    await page.getByRole('button', { name: 'Usar 3,5 horas' }).click();
    await next(page);
    await scan(page);
    await page.getByRole('radio').first().check({ force: true });
    await next(page);
    await scan(page);
    await pick(page, /Grupo de 3/);
    await next(page);
    await next(page);
    await scan(page);
    await page.locator('#p0-name').fill('Ana');
    await page.getByRole('checkbox', { name: 'Gramática' }).check({ force: true });
    await page.locator('#p1-name').fill('Luis');
    await page.locator('#p2-name').fill('Marta');
    await next(page);
    await scan(page);
  });
});
