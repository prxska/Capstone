import { createMedication, expect, fireAlerts, readScheduled, readStored, RECIPES_KEY, test } from './helpers';

test.describe('Alertas de medicamentos', () => {
  test('varios medicamentos a la misma hora comparten un solo aviso', async ({ guest }) => {
    await createMedication(guest, { name: 'Uno' });
    await createMedication(guest, { name: 'Dos' });
    await createMedication(guest, { name: 'Tres' });

    await expect.poll(async () => (await readScheduled(guest))[0]?.alerts.length).toBe(3);
    const [group] = await readScheduled(guest);
    expect(group.alerts.map((a) => a.medication).sort()).toEqual(['Dos', 'Tres', 'Uno']);
  });

  test('medicamentos a distinta hora tienen avisos separados', async ({ guest }) => {
    await createMedication(guest, { name: 'Mañanero', minutes: '10' });
    await createMedication(guest, { name: 'Tardío', minutes: '40' });

    await expect.poll(async () => (await readScheduled(guest)).length).toBeGreaterThan(1);
    for (const group of await readScheduled(guest)) expect(group.alerts).toHaveLength(1);
  });

  test('la ventana avanza de a uno y registra solo lo aceptado', async ({ guest }) => {
    await createMedication(guest, { name: 'Uno' });
    await createMedication(guest, { name: 'Dos' });
    await createMedication(guest, { name: 'Tres' });

    await expect.poll(async () => (await readScheduled(guest))[0]?.alerts.length).toBe(3);
    const [{ alerts }] = await readScheduled(guest);
    await fireAlerts(guest, alerts);

    await expect(guest.getByText('Medicamento 1 de 3')).toBeVisible();
    await expect(guest.getByText(alerts[0].medication, { exact: true }).last()).toBeVisible();
    await guest.getByText('Ya me la tomé · Siguiente').click();

    await expect(guest.getByText('Medicamento 2 de 3')).toBeVisible();
    await expect(guest.getByText(alerts[1].medication, { exact: true }).last()).toBeVisible();
    await guest.getByText('Omitir este medicamento').click();

    await expect(guest.getByText('Medicamento 3 de 3')).toBeVisible();
    await expect(guest.getByText('Cerrar sin marcar')).toBeVisible();
    await guest.getByText('Ya me la tomé', { exact: true }).last().click();
    await expect(guest.getByText('Hora del medicamento')).toBeHidden();

    const saved = await readStored(guest, RECIPES_KEY);
    expect(saved.every((recipe) => !Object.prototype.hasOwnProperty.call(recipe, 'stock'))).toBe(true);
  });

  test('una alerta que llega con la ventana abierta se suma al final', async ({ guest }) => {
    await createMedication(guest, { name: 'Primero' });
    await createMedication(guest, { name: 'Segundo', minutes: '30' });

    await expect.poll(async () => (await readScheduled(guest)).length).toBeGreaterThan(1);
    const groups = await readScheduled(guest);
    const primero = groups.find((g) => g.alerts[0].medication === 'Primero')!;
    const segundo = groups.find((g) => g.alerts[0].medication === 'Segundo')!;

    await fireAlerts(guest, primero.alerts);
    await expect(guest.getByText('Primero', { exact: true }).last()).toBeVisible();
    await expect(guest.getByText(/^Medicamento \d de \d$/)).toBeHidden();

    await fireAlerts(guest, segundo.alerts);
    await expect(guest.getByText('Medicamento 1 de 2')).toBeVisible();
    await expect(guest.getByText('Primero', { exact: true }).last()).toBeVisible();

    await guest.getByText('Ya me la tomé · Siguiente').click();
    await expect(guest.getByText('Segundo', { exact: true }).last()).toBeVisible();
  });

  test('un solo medicamento no muestra contador', async ({ guest }) => {
    await createMedication(guest, { name: 'Solo' });

    await expect.poll(async () => (await readScheduled(guest)).length).toBeGreaterThan(0);
    const [{ alerts }] = await readScheduled(guest);
    await fireAlerts(guest, alerts);

    await expect(guest.getByText('Hora del medicamento')).toBeVisible();
    await expect(guest.getByText(/^Medicamento \d de \d$/)).toBeHidden();
    await guest.getByText('Cerrar sin marcar').click();
    await expect(guest.getByText('Hora del medicamento')).toBeHidden();
  });
});
