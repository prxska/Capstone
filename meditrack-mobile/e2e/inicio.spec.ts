import type { Page } from '@playwright/test';
import { createAppointment, createMedication, expect, fireAlerts, readScheduled, readStored, RECIPES_KEY, test } from './helpers';

/** Fija la hora del navegador y recarga. Los medicamentos de prueba toman a las 08:00, 16:00 y 00:00. */
async function setTime(page: Page, hours: number, minutes = 0) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  await page.clock.setFixedTime(date);
  await page.reload();
  await expect(page.getByText('+ Receta')).toBeVisible();
}

const taken = (page: Page) => page.getByText('Ya me la tomé', { exact: true });

test.describe('Pantalla principal', () => {
  test('sin medicamentos invita a agregarlos', async ({ guest }) => {
    await expect(guest.getByText('Aún no hay medicamentos')).toBeVisible();
    await expect(taken(guest)).toBeHidden();
  });

  test('muestra el estado según la hora', async ({ guest }) => {
    await createMedication(guest, { name: 'Losartán' });

    await setTime(guest, 7);
    await expect(guest.getByText('Próxima toma')).toBeVisible();
    await expect(guest.getByText('08:00', { exact: true })).toBeVisible();

    await setTime(guest, 8, 10);
    await expect(guest.getByText('Es hora de tomarla')).toBeVisible();

    await setTime(guest, 9);
    await expect(guest.getByText('Toma atrasada')).toBeVisible();

    // Pasada 1 hora ya no la sugiere: pasa a la de las 16:00
    await setTime(guest, 9, 1);
    await expect(guest.getByText('Próxima toma')).toBeVisible();
    await expect(guest.getByText('16:00', { exact: true })).toBeVisible();
  });

  test('"Ya me la tomé" descuenta el stock, avanza y se recuerda al recargar', async ({ guest }) => {
    await createMedication(guest, { name: 'Losartán', stock: '30' });
    await setTime(guest, 8, 5);

    await taken(guest).click();
    await expect(guest.getByText('16:00', { exact: true })).toBeVisible();
    await expect.poll(async () => (await readStored(guest, RECIPES_KEY))[0].stock).toBe(29);

    await guest.reload();
    await expect(guest.getByText('16:00', { exact: true })).toBeVisible();
    expect((await readStored(guest, RECIPES_KEY))[0].stock).toBe(29);
  });

  test('"Ahora no" avanza sin descontar', async ({ guest }) => {
    await createMedication(guest, { name: 'Losartán', stock: '30' });
    await setTime(guest, 8, 5);

    await guest.getByText('Ahora no').click();
    await expect(guest.getByText('16:00', { exact: true })).toBeVisible();
    expect((await readStored(guest, RECIPES_KEY))[0].stock).toBe(30);
  });

  test('varios a la misma hora se muestran de a uno', async ({ guest }) => {
    await createMedication(guest, { name: 'Uno' });
    await createMedication(guest, { name: 'Dos' });
    await setTime(guest, 8, 5);

    await expect(guest.getByText('1 de 2')).toBeVisible();
    await taken(guest).click();
    await expect(guest.getByText('2 de 2')).toBeVisible();
    await taken(guest).click();
    await expect(guest.getByText('16:00', { exact: true })).toBeVisible();
  });

  test('de noche, un medicamento nuevo empieza hoy y no mañana', async ({ guest }) => {
    await setTime(guest, 22);
    await createMedication(guest, { name: 'Nocturno' });

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect((await readStored(guest, RECIPES_KEY))[0].start_date).toBe(today);
    await expect(guest.getByRole('button', { name: /^Eliminar Nocturno/ }).last()).toBeVisible();
  });

  test('el saludo muestra solo el primer nombre', async ({ guest }) => {
    await guest.getByLabel('Mi perfil').click();
    await guest.getByLabel('Cambiar tu nombre').click();
    await guest.getByPlaceholder(/^Nombre, ej/).fill('Ana María Pérez');
    await guest.getByText('Guardar', { exact: true }).click();
    await expect(guest.getByText('Ana María Pérez').first()).toBeVisible();

    await guest.goto('/');
    await expect(guest.getByText('Hola, Ana', { exact: true })).toBeVisible();
  });

  test('los botones de abajo son iguales, simétricos y con el texto centrado', async ({ guest }) => {
    const width = guest.viewportSize()!.width;
    const recipe = (await guest.getByRole('button', { name: '+ Receta' }).boundingBox())!;
    const appointment = (await guest.getByRole('button', { name: '+ Cita Médica' }).boundingBox())!;

    expect(Math.abs(recipe.width - appointment.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(recipe.height - appointment.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(recipe.x - (width - (appointment.x + appointment.width)))).toBeLessThanOrEqual(1);

    for (const [name, tile] of [['+ Receta', recipe], ['+ Cita Médica', appointment]] as const) {
      const label = (await guest.getByText(name, { exact: true }).boundingBox())!;
      const center = label.x + label.width / 2;
      expect(Math.abs(center - (tile.x + tile.width / 2))).toBeLessThanOrEqual(1);
    }

    const tiles = [recipe, appointment];
    for (const [index, tile] of tiles.entries()) {
      const icon = (await guest.getByTestId('action-tile-icon').nth(index).boundingBox())!;
      expect(Math.abs(icon.x + icon.width / 2 - (tile.x + tile.width / 2))).toBeLessThanOrEqual(1);
      expect(icon.y - tile.y).toBeGreaterThanOrEqual(8);
    }
  });

  test('el degradado del encabezado cubre todo el contenedor', async ({ guest }) => {
    const gradient = guest.getByTestId('gradient').first();
    const measured = await gradient.evaluate((node) => {
      const own = node.getBoundingClientRect();
      const parent = node.parentElement!.getBoundingClientRect();
      return {
        image: getComputedStyle(node).backgroundImage,
        gaps: [own.left - parent.left, own.top - parent.top, parent.right - own.right, parent.bottom - own.bottom],
      };
    });

    expect(measured.image).toContain('linear-gradient');
    for (const gap of measured.gaps) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  });

  test('sin tomas pendientes avisa que está todo listo', async ({ guest }) => {
    await createMedication(guest, { name: 'Losartán' });
    await setTime(guest, 23);
    await expect(guest.getByText('Por hoy, todo listo')).toBeVisible();
  });

  test('una toma marcada en la tarjeta no vuelve a preguntar ni descuenta dos veces', async ({ guest }) => {
    await createMedication(guest, { name: 'Losartán', stock: '30' });
    await setTime(guest, 7, 59);
    await expect.poll(async () => (await readScheduled(guest)).length).toBeGreaterThan(0);
    const [{ alerts }] = await readScheduled(guest);
    expect(alerts[0].time).toBe('08:00');

    await taken(guest).click();
    await expect.poll(async () => (await readStored(guest, RECIPES_KEY))[0].stock).toBe(29);

    await fireAlerts(guest, alerts);
    await expect(guest.getByText('Hora del medicamento')).toBeHidden();
    expect((await readStored(guest, RECIPES_KEY))[0].stock).toBe(29);
  });

  test('el calendario semanal cambia la agenda y las citas futuras siguen a la vista', async ({ guest }) => {
    await createAppointment(guest, { doctor: 'Dra. Vega' });
    await expect(guest.getByText('Agenda de hoy')).toBeVisible();

    const today = guest.getByRole('tab', { selected: true });
    await expect(today).toHaveCount(1);
    const label = await guest.getByRole('tab', { selected: false }).first().getAttribute('aria-label');
    await guest.getByRole('tab', { name: label! }).click();

    await expect(guest.getByText('Agenda de hoy')).toBeHidden();
    await expect(guest.getByRole('tab', { name: label! })).toHaveAttribute('aria-selected', 'true');
  });
});
