import { createMedication, expect, pressDialog, readStored, RECIPES_KEY, test } from './helpers';

test.describe('Perfil y ajustes', () => {
  test('agrega, renombra y elimina un perfil de cuidado', async ({ guest }) => {
    await guest.goto('/profile');

    await guest.getByText('Agregar perfil').click();
    await guest.getByPlaceholder(/^Nombre, ej/).fill('Mamá');
    await guest.getByText('Guardar', { exact: true }).click();
    await expect(guest.getByText('Mamá', { exact: true })).toBeVisible();

    await guest.getByLabel('Cambiar nombre de Mamá').click();
    await guest.getByPlaceholder(/^Nombre, ej/).fill('Abuela');
    await guest.getByText('Guardar', { exact: true }).click();
    await expect(guest.getByText('Abuela', { exact: true })).toBeVisible();

    await guest.getByLabel('Eliminar perfil de Abuela').click();
    await pressDialog(guest, 'Eliminar');
    await expect(guest.getByText('Abuela', { exact: true })).toBeHidden();
  });

  test('no guarda un perfil sin nombre', async ({ guest }) => {
    await guest.goto('/profile');
    await guest.getByText('Agregar perfil').click();
    await guest.getByText('Guardar', { exact: true }).click();
    expect(await pressDialog(guest)).toBe('Falta el nombre');
  });

  test('un medicamento queda asociado al perfil activo', async ({ guest }) => {
    await guest.goto('/profile');
    await guest.getByText('Agregar perfil').click();
    await guest.getByPlaceholder(/^Nombre, ej/).fill('Tomás');
    await guest.getByText('Guardar', { exact: true }).click();
    await expect(guest.getByText('Tomás', { exact: true })).toBeVisible();

    await guest.goto('/');
    await guest.getByText('Tomás', { exact: true }).click();
    await createMedication(guest, { name: 'Jarabe' });

    const [saved] = await readStored(guest, RECIPES_KEY);
    expect(saved.patient).toBe('Tomás');
    await expect(guest.getByRole('button', { name: /^Eliminar Jarabe/ }).last()).toBeVisible();
  });

  test('el modo oscuro y la letra grande se recuerdan al recargar', async ({ guest }) => {
    await guest.goto('/profile');
    await expect(guest.getByText('Desactivado (Fondo claro)')).toBeVisible();
    await expect(guest.getByText('Tamaño normal')).toBeVisible();

    await guest.getByRole('switch').nth(0).click();
    await expect(guest.getByText('Activado (Fondo oscuro)')).toBeVisible();
    await guest.getByRole('switch').nth(1).click();
    await expect(guest.getByText('Letras grandes y legibles')).toBeVisible();

    await guest.reload();
    await expect(guest.getByText('Activado (Fondo oscuro)')).toBeVisible();
    await expect(guest.getByText('Letras grandes y legibles')).toBeVisible();
  });

  test('el historial vacío lo indica', async ({ guest }) => {
    await guest.goto('/profile');
    await guest.getByText('Ver historial de medicamentos').click();
    await expect(guest.getByText('No hay medicamentos en el historial.')).toBeVisible();
  });

  test('el tutorial se puede ver de nuevo', async ({ guest }) => {
    await guest.getByLabel('Agregar o administrar perfiles').click();
    await guest.getByText('Ver tutorial de nuevo').click();
    await expect(guest.getByText('Saltar', { exact: true })).toBeVisible();
  });
});
