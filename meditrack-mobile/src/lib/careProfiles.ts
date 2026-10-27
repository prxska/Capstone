import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalAuth } from './storage';
import { supabase } from './supabase';

export type CareProfile = { id: string; name: string };

// El titular de la cuenta no tiene fila en care_profiles: sus registros guardan profile_id = NULL
export const OWNER_PROFILE_ID = 'owner';

const LOCAL_PROFILES_KEY = '@meditrack_local_profiles';
const LOCAL_OWNER_NAME_KEY = '@meditrack_owner_name';
const ACTIVE_PROFILE_KEY = '@meditrack_active_profile';
const LOCAL_RECIPES_KEY = '@meditrack_local_recipes';
const LOCAL_APPTS_KEY = '@meditrack_local_appointments';

export const toDbProfileId = (profileId: string) => (profileId === OWNER_PROFILE_ID ? null : profileId);
export const fromDbProfileId = (value: unknown) => (value ? String(value) : OWNER_PROFILE_ID);

export function describeMissingMigration(message: string) {
  return /profile_id|care_profiles|stock/i.test(message) && /column|relation|schema cache|does not exist/i.test(message)
    ? 'La base de datos aún no tiene perfiles ni stock. Ejecuta en Supabase el archivo supabase/migrations/20261018_care_profiles_and_stock.sql.'
    : message;
}

async function readLocal(key: string): Promise<any[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export async function listCareProfiles(): Promise<CareProfile[]> {
  if (await LocalAuth.isGuestMode()) return readLocal(LOCAL_PROFILES_KEY);

  const { data, error } = await supabase.from('care_profiles').select('id, name').order('created_at');
  if (error) {
    // Sin la migración la app sigue funcionando solo con el titular
    console.warn('No se pudieron cargar los perfiles:', error.message);
    return [];
  }
  return (data || []).map((p) => ({ id: String(p.id), name: p.name }));
}

export async function createCareProfile(name: string) {
  const trimmed = name.trim();
  if (await LocalAuth.isGuestMode()) {
    const list = await readLocal(LOCAL_PROFILES_KEY);
    list.push({ id: `prof_${Date.now()}`, name: trimmed });
    await AsyncStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
    return;
  }
  const { error } = await supabase.from('care_profiles').insert([{ name: trimmed }]);
  if (error) throw new Error(describeMissingMigration(error.message));
}

export async function renameCareProfile(id: string, name: string) {
  const trimmed = name.trim();
  if (await LocalAuth.isGuestMode()) {
    const [profiles, recipes, appointments] = await Promise.all([
      readLocal(LOCAL_PROFILES_KEY),
      readLocal(LOCAL_RECIPES_KEY),
      readLocal(LOCAL_APPTS_KEY),
    ]);
    const rename = (item: any) => (item.profile_id === id ? { ...item, patient: trimmed } : item);
    await AsyncStorage.multiSet([
      [LOCAL_PROFILES_KEY, JSON.stringify(profiles.map((p) => (p.id === id ? { ...p, name: trimmed } : p)))],
      [LOCAL_RECIPES_KEY, JSON.stringify(recipes.map(rename))],
      [LOCAL_APPTS_KEY, JSON.stringify(appointments.map(rename))],
    ]);
    return;
  }
  const { error } = await supabase.from('care_profiles').update({ name: trimmed }).eq('id', id);
  if (error) throw new Error(describeMissingMigration(error.message));
  // El nombre del paciente se muestra en las tarjetas y alertas
  await Promise.all([
    supabase.from('recipes').update({ patient: trimmed }).eq('profile_id', id),
    supabase.from('appointments').update({ patient: trimmed }).eq('profile_id', id),
  ]);
}

/** Borra el perfil junto con sus recetas y citas. */
export async function deleteCareProfile(id: string) {
  if (await LocalAuth.isGuestMode()) {
    const keep = (item: any) => item.profile_id !== id;
    const [profiles, recipes, appointments] = await Promise.all([
      readLocal(LOCAL_PROFILES_KEY),
      readLocal(LOCAL_RECIPES_KEY),
      readLocal(LOCAL_APPTS_KEY),
    ]);
    await AsyncStorage.multiSet([
      [LOCAL_PROFILES_KEY, JSON.stringify(profiles.filter((p) => p.id !== id))],
      [LOCAL_RECIPES_KEY, JSON.stringify(recipes.filter(keep))],
      [LOCAL_APPTS_KEY, JSON.stringify(appointments.filter(keep))],
    ]);
  } else {
    // Las recetas y citas se borran en cascada (on delete cascade)
    const { error } = await supabase.from('care_profiles').delete().eq('id', id);
    if (error) throw new Error(describeMissingMigration(error.message));
  }
  if ((await getActiveProfileId()) === id) await setActiveProfileId(OWNER_PROFILE_ID);
}

/** Nombre del titular de la cuenta ("Yo"); '' si aún no tiene uno. */
export async function getOwnerName(): Promise<string> {
  if (await LocalAuth.isGuestMode()) return (await AsyncStorage.getItem(LOCAL_OWNER_NAME_KEY)) || '';
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.full_name || '';
}

export async function setOwnerName(name: string) {
  const trimmed = name.trim();
  if (await LocalAuth.isGuestMode()) {
    const [recipes, appointments] = await Promise.all([readLocal(LOCAL_RECIPES_KEY), readLocal(LOCAL_APPTS_KEY)]);
    const rename = (item: any) => (item.profile_id ? item : { ...item, patient: trimmed });
    await AsyncStorage.multiSet([
      [LOCAL_OWNER_NAME_KEY, trimmed],
      [LOCAL_RECIPES_KEY, JSON.stringify(recipes.map(rename))],
      [LOCAL_APPTS_KEY, JSON.stringify(appointments.map(rename))],
    ]);
    return;
  }

  const { data, error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) return;

  // El nombre del paciente se muestra en las tarjetas y alertas de los registros del titular
  for (const table of ['recipes', 'appointments']) {
    const { error: updateError } = await supabase
      .from(table)
      .update({ patient: trimmed })
      .eq('user_id', userId)
      .is('profile_id', null);
    // Sin la migración no existe profile_id: todos los registros son del titular
    if (updateError && /profile_id/i.test(updateError.message)) {
      await supabase.from(table).update({ patient: trimmed }).eq('user_id', userId);
    }
  }
}

export async function getActiveProfileId() {
  return (await AsyncStorage.getItem(ACTIVE_PROFILE_KEY)) || OWNER_PROFILE_ID;
}

export async function setActiveProfileId(id: string) {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
}
