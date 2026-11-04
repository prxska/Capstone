import { expect, pressDialog, test } from './helpers';

test.describe('Acceso', () => {
  test('sin sesión lleva a la pantalla de login', async ({ fresh }) => {
    await fresh.goto('/');
    await expect(fresh.getByText('Iniciar Sesión')).toBeVisible();
  });

  test('pide correo y contraseña para iniciar sesión', async ({ fresh }) => {
    await fresh.goto('/');
    await fresh.getByText('Iniciar Sesión').click();
    expect(await pressDialog(fresh)).toBe('Datos incompletos');
  });

  test('el registro valida el nombre, las contraseñas y su largo', async ({ fresh }) => {
    await fresh.goto('/');
    await fresh.getByText('Regístrate aquí').click();
    await fresh.getByPlaceholder('tu@email.com').fill('prueba@example.com');
    await fresh.getByPlaceholder('Mínimo 6 caracteres').fill('123');

    await fresh.getByText('Registrar Paciente').click();
    expect(await pressDialog(fresh)).toBe('Nombre requerido');

    await fresh.getByPlaceholder('Ej. Juan Pérez').fill('Ana Prueba');
    await fresh.getByPlaceholder('Repite tu contraseña').fill('456');
    await fresh.getByText('Registrar Paciente').click();
    expect(await pressDialog(fresh)).toBe('Contraseñas no coinciden');

    await fresh.getByPlaceholder('Repite tu contraseña').fill('123');
    await fresh.getByText('Registrar Paciente').click();
    expect(await pressDialog(fresh)).toBe('Contraseña débil');
  });

  test('entra en modo local, muestra el tutorial una vez y permite salir', async ({ fresh }) => {
    await fresh.goto('/');
    await fresh.getByText('Continuar sin cuenta (Modo Local)').click();
    await pressDialog(fresh, 'Comenzar sin cuenta');

    await expect(fresh.getByText('Saltar', { exact: true })).toBeVisible();
    await fresh.getByText('Saltar', { exact: true }).click();
    await expect(fresh.getByText('+ Receta')).toBeVisible();

    await fresh.reload();
    await expect(fresh.getByText('+ Receta')).toBeVisible();
    await expect(fresh.getByText('Saltar', { exact: true })).toBeHidden();

    await fresh.goto('/profile');
    await fresh.getByText('Salir del Modo Local').click();
    await pressDialog(fresh, 'Salir');
    await expect(fresh.getByText('Iniciar Sesión')).toBeVisible();
  });

  test('el tutorial se puede recorrer completo', async ({ fresh }) => {
    await fresh.goto('/');
    await fresh.getByText('Continuar sin cuenta (Modo Local)').click();
    await pressDialog(fresh, 'Comenzar sin cuenta');

    const next = fresh.getByText('Siguiente', { exact: true });
    await expect(next).toBeVisible();
    while (await next.isVisible()) await next.click();
    await fresh.getByText('Comenzar', { exact: true }).click();
    await expect(fresh.getByText('Saltar', { exact: true })).toBeHidden();
    await expect(fresh.getByText('+ Receta')).toBeVisible();
  });
});
