import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { LocalAuth } from './storage';

// Cierra la sesión del navegador si la app se reabre por el deep link de retorno.
WebBrowser.maybeCompleteAuthSession();

export const OAUTH_CALLBACK_PATH = 'auth-callback';

export type OAuthProvider = 'google';

// Supabase devuelve los tokens en el fragmento (#access_token=...) o en el query (?error=...).
function readUrlParams(url: string) {
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';
  return new URLSearchParams([query, hash].filter(Boolean).join('&'));
}

/**
 * Inicia sesión con un proveedor OAuth 2.0 vía Supabase.
 * Devuelve `false` si el usuario cerró el navegador sin completar el acceso.
 * Lanza un Error si el proveedor o Supabase rechazan el acceso.
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<boolean> {
  const redirectTo = Linking.createURL(OAUTH_CALLBACK_PATH);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Supabase no entregó la URL de autorización.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const params = readUrlParams(result.url);
  const providerError = params.get('error_description') || params.get('error');
  if (providerError) throw new Error(providerError.replace(/\+/g, ' '));

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('La respuesta del proveedor no incluyó una sesión válida.');
  }

  // Antes de crear la sesión, para que el resto de la app no siga en modo local.
  await LocalAuth.setGuestMode(false);

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;

  return true;
}
