import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_FALLBACK_URL = 'https://akirezlsvgkperdwkxrd.supabase.co';
const SUPABASE_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFraXJlemxzdmdrcGVyZHdreHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Mjg4ODcsImV4cCI6MjEwNTAwNDg4N30.WyJkli8M5ijLK9nWOQW37QvuUcaxr7z3K49WGA0LmCM';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_FALLBACK_URL;
const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.EXPO_PUBLIC_SUPABASE_KEY || 
  SUPABASE_FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});