import { APPOINTMENTS_KEY, createAppointment, expect, pressDialog, readStored, test } from './helpers';

test.describe('Citas médicas', () => {
  test('crea una cita con cualquier minuto y sigue ahí al recargar', async ({ guest }) => {
    await createAppointment(guest, { doctor: 'Dra. Rojas', location: 'Box 4', minutes: '23' });

    await expect(guest.getByRole('button', { name: 'Eliminar Cita: Dra. Rojas' }).last()).toBeVisible();
    const [saved] = await readStored(guest, APPOINTMENTS_KEY);
    expect(saved).toMatchObject({ doctor: 'Dra. Rojas', location: 'Box 4' });
    expect(saved.time ?? saved.appointment_time).toMatch(/^\d{2}:23/);

    await guest.reload();
    await expect(guest.getByRole('button', { name: 'Eliminar Cita: Dra. Rojas' }).last()).toBeVisible();
  });

  test('no guarda sin médico', async ({ guest }) => {
    await guest.getByText('+ Cita Médica').click();
    await guest.getByText('Guardar en Teléfono').click();
    expect(await pressDialog(guest)).toBe('Incompleto');
    expect(await readStored(guest, APPOINTMENTS_KEY)).toEqual([]);
  });

  test('los botones de minutos avanzan de a uno', async ({ guest }) => {
    await guest.getByText('+ Cita Médica').click();
    const minutes = guest.getByLabel('Minutos');
    await expect(minutes).toHaveValue('00');
    await guest.getByLabel('Sumar un minuto').click();
    await expect(minutes).toHaveValue('01');
    await guest.getByLabel('Restar un minuto').click();
    await guest.getByLabel('Restar un minuto').click();
    await expect(minutes).toHaveValue('59');
  });

  test('edita y elimina una cita', async ({ guest }) => {
    await createAppointment(guest, { doctor: 'Dr. Soto' });

    await guest.getByText('Cita: Dr. Soto').last().click();
    await expect(guest.getByText('Editar Cita Médica')).toBeVisible();
    await guest.getByPlaceholder('Ej. Dra. Gómez').fill('Dr. Soto Pérez');
    await guest.getByText('Actualizar en Teléfono').click();
    await expect(guest.getByText('Editar Cita Médica')).toBeHidden();
    await expect(guest.getByRole('button', { name: 'Eliminar Cita: Dr. Soto Pérez' }).last()).toBeVisible();

    await guest.getByRole('button', { name: 'Eliminar Cita: Dr. Soto Pérez' }).last().click();
    expect(await pressDialog(guest, 'Eliminar')).toBe('Eliminar cita');
    await expect(guest.getByRole('button', { name: /^Eliminar Cita/ })).toHaveCount(0);
  });

  test('el calendario abre el detalle del día', async ({ guest }) => {
    await createAppointment(guest, { doctor: 'Dra. Vega' });
    await guest.getByText('Ver el mes completo').click();
    await guest.getByLabel(/, 1 registros$/).first().click();
    await expect(guest.getByLabel('Cerrar')).toBeVisible();
    await expect(guest.getByText('Cita: Dra. Vega').last()).toBeVisible();
    await guest.getByLabel('Cerrar').click();
    await expect(guest.getByLabel('Cerrar')).toBeHidden();
  });
});
