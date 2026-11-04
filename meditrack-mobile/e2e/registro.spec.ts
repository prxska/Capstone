import type { Page } from '@playwright/test';
import { expect, pressDialog, test } from './helpers';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

const USER = { id: '00000000-0000-0000-0000-000000000000', aud: 'authenticated', email: 'ana@example.com' };

// Respuesta simulada: ninguna de estas pruebas crea cuentas de verdad
async function mockSignUp(page: Page, status: number, body: object) {
  await page.route(/\/auth\/v1\/signup/, (route) =>
    route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

async function submitRegistration(page: Page) {
  await page.goto('/');
  await page.getByText('Regístrate aquí').click();
  await page.getByPlaceholder('Ej. Juan Pérez').fill('Ana Prueba');
  await page.getByPlaceholder('tu@email.com').fill('ana@example.com');
  await page.getByPlaceholder('Mínimo 6 caracteres').fill('secreto1');
  await page.getByPlaceholder('Repite tu contraseña').fill('secreto1');
  await page.getByText('Registrar Paciente').click();
}

test.describe('Registro con una cuenta que ya existe', () => {
  test('muestra la ventana cuando Supabase avisa el error', async ({ fresh }) => {
    await mockSignUp(fresh, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
    await submitRegistration(fresh);

    await expect(fresh.getByText('Esta cuenta ya existe')).toBeVisible();
    await expect(fresh.getByText('ana@example.com')).toBeVisible();
    await expect(fresh.getByText('User already registered')).toBeHidden();
  });

  test('la detecta aunque Supabase responda sin error', async ({ fresh }) => {
    await mockSignUp(fresh, 200, { ...USER, identities: [] });
    await submitRegistration(fresh);

    await expect(fresh.getByText('Esta cuenta ya existe')).toBeVisible();
    await expect(fresh.getByText('¡Cuenta creada!')).toBeHidden();
  });

  test('"Iniciar sesión" lleva al login con el correo ya escrito', async ({ fresh }) => {
    await mockSignUp(fresh, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
    await submitRegistration(fresh);

    await fresh.getByText('Iniciar sesión', { exact: true }).click();
    await expect(fresh.getByText('Esta cuenta ya existe')).toBeHidden();
    await expect(fresh.getByText('Iniciar Sesión', { exact: true })).toBeVisible();
    await expect(fresh.getByPlaceholder('tu@email.com')).toHaveValue('ana@example.com');
    await expect(fresh.getByPlaceholder('Mínimo 6 caracteres')).toHaveValue('');
  });

  test('"Usar otro correo" se queda en el registro con el correo vacío', async ({ fresh }) => {
    await mockSignUp(fresh, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
    await submitRegistration(fresh);

    await fresh.getByText('Usar otro correo').click();
    await expect(fresh.getByText('Esta cuenta ya existe')).toBeHidden();
    await expect(fresh.getByText('Registrar Paciente')).toBeVisible();
    await expect(fresh.getByPlaceholder('tu@email.com')).toHaveValue('');
    await expect(fresh.getByPlaceholder('Ej. Juan Pérez')).toHaveValue('Ana Prueba');
  });

  test('un registro nuevo sigue confirmando que se creó', async ({ fresh }) => {
    await mockSignUp(fresh, 200, { ...USER, identities: [{ id: '1' }] });
    await submitRegistration(fresh);

    expect(await pressDialog(fresh)).toBe('¡Cuenta creada!');
    await expect(fresh.getByText('Esta cuenta ya existe')).toBeHidden();
  });
});
