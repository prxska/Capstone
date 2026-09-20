import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const GUEST_KEY = '@meditrack_guest_mode';
const LOCAL_RECIPES_KEY = '@meditrack_local_recipes';
const LOCAL_APPOINTMENTS_KEY = '@meditrack_local_appointments';

export const LocalAuth = {
  async setGuestMode(enabled: boolean) {
    await AsyncStorage.setItem(GUEST_KEY, enabled ? 'true' : 'false');
  },
  async isGuestMode(): Promise<boolean> {
    const val = await AsyncStorage.getItem(GUEST_KEY);
    return val === 'true';
  },
  async clearGuestMode() {
    await AsyncStorage.removeItem(GUEST_KEY);
  }
};

export const DataService = {
  async getEvents(userName: string) {
    const isGuest = await LocalAuth.isGuestMode();

    if (isGuest) {
      const rawRecipes = await AsyncStorage.getItem(LOCAL_RECIPES_KEY);
      const rawApps = await AsyncStorage.getItem(LOCAL_APPOINTMENTS_KEY);
      const recipes = rawRecipes ? JSON.parse(rawRecipes) : [];
      const appointments = rawApps ? JSON.parse(rawApps) : [];
      return { recipes, appointments, isGuest: true };
    }

    // Si tiene cuenta activa en Supabase
    const [{ data: recipes, error: rError }, { data: appointments, error: aError }] = await Promise.all([
      supabase.from('recipes').select('*').eq('patient', userName),
      supabase.from('appointments').select('*').eq('patient', userName)
    ]);

    if (rError) throw rError;
    if (aError) throw aError;

    return { recipes: recipes || [], appointments: appointments || [], isGuest: false };
  },

  async saveRecipe(payload: any, editingId?: string | null) {
    const isGuest = await LocalAuth.isGuestMode();

    if (isGuest) {
      const raw = await AsyncStorage.getItem(LOCAL_RECIPES_KEY);
      let list = raw ? JSON.parse(raw) : [];

      if (editingId) {
        list = list.map((item: any) => item.id === editingId ? { ...payload, id: editingId } : item);
      } else {
        list.push({ ...payload, id: Date.now().toString() });
      }

      await AsyncStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(list));
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('recipes').update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('recipes').insert([payload]);
      if (error) throw error;
    }
  },

  async deleteRecipe(id: string) {
    const isGuest = await LocalAuth.isGuestMode();
    if (isGuest) {
      const raw = await AsyncStorage.getItem(LOCAL_RECIPES_KEY);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter((item: any) => item.id !== id);
      await AsyncStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(list));
      return;
    }
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  },

  async saveAppointment(payload: any, editingId?: string | null) {
    const isGuest = await LocalAuth.isGuestMode();

    if (isGuest) {
      const raw = await AsyncStorage.getItem(LOCAL_APPOINTMENTS_KEY);
      let list = raw ? JSON.parse(raw) : [];

      if (editingId) {
        list = list.map((item: any) => item.id === editingId ? { ...payload, id: editingId } : item);
      } else {
        list.push({ ...payload, id: Date.now().toString() });
      }

      await AsyncStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(list));
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('appointments').insert([payload]);
      if (error) throw error;
    }
  },

  async deleteAppointment(id: string) {
    const isGuest = await LocalAuth.isGuestMode();
    if (isGuest) {
      const raw = await AsyncStorage.getItem(LOCAL_APPOINTMENTS_KEY);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter((item: any) => item.id !== id);
      await AsyncStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(list));
      return;
    }
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  }
};
