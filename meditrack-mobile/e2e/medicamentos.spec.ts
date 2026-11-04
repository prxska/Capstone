import { createMedication, expect, pressDialog, readStored, RECIPES_KEY, test } from './helpers';

test.describe('Medicamentos', () => {
  test('crea un medicamento con el asistente y sigue ahí al recargar', async ({ guest }) => {
    await createMedication(guest, { name: 'Losartán', amount: '2', stock: '30' });

    const delete_ = guest.getByRole('button', { name: /^Eliminar Losartán/ }).last();
    await expect(delete_).toBeVisible();

    const [saved] = await readStored(guest, RECIPES_KEY);
    expect(saved).toMatchObject({ medication: 'Losartán', stock: 30, start_time: '08:00' });

    await guest.reload();
    await expect(guest.getByRole('button', { name: /^Eliminar Losartán/ }).last()).toBeVisible();
  });

  test('no guarda sin nombre ni con una cantidad inválida', async ({ guest }) => {
    await guest.getByText('+ Receta').click();
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Guardar en Teléfono').click();
    expect(await pressDialog(guest)).toBe('Incompleto');
    expect(await readStored(guest, RECIPES_KEY)).toEqual([]);

    await guest.getByText('Atrás', { exact: true }).click();
    await guest.getByText('Atrás', { exact: true }).click();
    await guest.getByPlaceholder('Ej. Paracetamol').fill('Aspirina');
    await guest.getByPlaceholder(/^Ej\. 30/).fill('muchas');
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Guardar en Teléfono').click();
    expect(await pressDialog(guest)).toBe('Cantidad no válida');
    expect(await readStored(guest, RECIPES_KEY)).toEqual([]);
  });

  test('permite elegir cualquier minuto con los botones y escribiéndolo', async ({ guest }) => {
    await guest.getByText('+ Receta').click();
    await guest.getByPlaceholder('Ej. Paracetamol').fill('Metformina');
    await guest.getByPlaceholder('Ej. 1', { exact: true }).fill('1');
    await guest.getByText('Siguiente', { exact: true }).click();

    const minutes = guest.getByLabel('Minutos');
    await expect(minutes).toHaveValue('00');

    await guest.getByLabel('Sumar un minuto').click();
    await expect(minutes).toHaveValue('01');

    await guest.getByLabel('Restar un minuto').click();
    await guest.getByLabel('Restar un minuto').click();
    await expect(minutes).toHaveValue('59');

    await guest.getByLabel('Sumar un minuto').click();
    await expect(minutes).toHaveValue('00');

    await minutes.fill('75');
    await expect(minutes).toHaveValue('59');

    await minutes.fill('37');
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Guardar en Teléfono').click();
    await expect(guest.getByText('Nueva Receta')).toBeHidden();

    const [saved] = await readStored(guest, RECIPES_KEY);
    expect(saved.start_time).toBe('08:37');
  });

  test('edita un medicamento existente', async ({ guest }) => {
    await createMedication(guest, { name: 'Ibuprofeno', stock: '20' });

    await guest.getByText(/^Ibuprofeno \(/).last().click();
    await expect(guest.getByText('Editar Receta')).toBeVisible();
    await guest.getByPlaceholder('Ej. Paracetamol').fill('Ibuprofeno 400');
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Siguiente', { exact: true }).click();
    await guest.getByText('Actualizar en Teléfono').click();
    await expect(guest.getByText('Editar Receta')).toBeHidden();

    const list = await readStored(guest, RECIPES_KEY);
    expect(list).toHaveLength(1);
    expect(list[0].medication).toBe('Ibuprofeno 400');
  });

  test('eliminar pide confirmación y lo manda al historial', async ({ guest }) => {
    await createMedication(guest, { name: 'Omeprazol' });
    const delete_ = guest.getByRole('button', { name: /^Eliminar Omeprazol/ }).last();

    await delete_.click();
    await pressDialog(guest, 'Cancelar');
    await expect(delete_).toBeVisible();

    await delete_.click();
    expect(await pressDialog(guest, 'Eliminar')).toBe('Eliminar medicamento');
    await expect(guest.getByRole('button', { name: /^Eliminar Omeprazol/ })).toHaveCount(0);

    await guest.goto('/profile');
    await guest.getByText('Ver historial de medicamentos').click();
    await expect(guest.getByText(/Omeprazol/).first()).toBeVisible();
    await expect(guest.getByText(/^Eliminado el:/)).toBeVisible();
  });

  test('avisa cuando quedan pocas', async ({ guest }) => {
    await createMedication(guest, { name: 'Atorvastatina', stock: '2' });
    await expect(guest.getByText('Quedan pocas: Atorvastatina')).toBeVisible();
  });
});
