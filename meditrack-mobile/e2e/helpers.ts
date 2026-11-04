import { expect, test as base, type Page } from '@playwright/test';

export const RECIPES_KEY = '@meditrack_local_recipes';
export const APPOINTMENTS_KEY = '@meditrack_local_appointments';

// Cada prueba corre en un navegador limpio y sin acceso a Supabase: solo usa el modo local
export const test = base.extend<{ fresh: Page; guest: Page }>({
  fresh: async ({ page }, provide) => {
    await page.route(/supabase\.co/, (route) => route.abort());
    await page.addInitScript(() => {
      (window as any).__MEDITRACK_E2E__ = { dialogs: [] };
    });
    await provide(page);
  },
  guest: async ({ fresh }, provide) => {
    await fresh.addInitScript(() => {
      localStorage.setItem('@meditrack_guest_mode', 'true');
      localStorage.setItem('@meditrack_tutorial_seen_guest', 'true');
    });
    await fresh.goto('/');
    await expect(fresh.getByText('+ Receta')).toBeVisible();
    await provide(fresh);
  },
});

export { expect };

/** Espera el diálogo abierto, presiona el botón indicado y devuelve su título. */
export async function pressDialog(page: Page, button?: string) {
  await page.waitForFunction(() => (window as any).__MEDITRACK_E2E__.dialogs.length > 0);
  return page.evaluate((text) => {
    const dialog = (window as any).__MEDITRACK_E2E__.dialogs.shift();
    if (text) {
      const target = dialog.buttons.find((b: any) => b.text === text);
      if (!target) throw new Error(`El diálogo "${dialog.title}" no tiene el botón "${text}"`);
      target.onPress?.();
    }
    return dialog.title as string;
  }, button);
}

export async function createMedication(
  page: Page,
  options: { name: string; amount?: string; stock?: string; minutes?: string }
) {
  await page.getByText('+ Receta').click();
  await page.getByPlaceholder('Ej. Paracetamol').fill(options.name);
  await page.getByPlaceholder('Ej. 1', { exact: true }).fill(options.amount ?? '1');
  if (options.stock) await page.getByPlaceholder(/^Ej\. 30/).fill(options.stock);
  await page.getByText('Siguiente', { exact: true }).click();
  if (options.minutes) await page.getByLabel('Minutos').fill(options.minutes);
  await page.getByText('Siguiente', { exact: true }).click();
  await page.getByText('Guardar en Teléfono').click();
  await expect(page.getByText('Nueva Receta')).toBeHidden();
}

export async function createAppointment(
  page: Page,
  options: { doctor: string; location?: string; minutes?: string }
) {
  await page.getByText('+ Cita Médica').click();
  await page.getByPlaceholder('Ej. Dra. Gómez').fill(options.doctor);
  if (options.location) await page.getByPlaceholder(/^Ej\. Hospital/).fill(options.location);
  if (options.minutes) await page.getByLabel('Minutos').fill(options.minutes);
  await page.getByText('Guardar en Teléfono').click();
  await expect(page.getByText('Nueva Cita Médica')).toBeHidden();
}

export function readStored(page: Page, key: string): Promise<any[]> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), key);
}

/** Los avisos que la app dejó programados, agrupados como llegarían al teléfono. */
export function readScheduled(page: Page): Promise<{ alerts: any[] }[]> {
  return page.evaluate(() => (window as any).__MEDITRACK_E2E__.scheduled ?? []);
}

/** Simula la llegada de una notificación con esas alertas. */
export async function fireAlerts(page: Page, alerts: any[]) {
  await page.waitForFunction(() => !!(window as any).__MEDITRACK_E2E__.fireAlerts);
  await page.evaluate((a) => (window as any).__MEDITRACK_E2E__.fireAlerts(a), alerts);
}
