import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Modal, Platform, Alert, ActivityIndicator,
  NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { LocalAuth } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';

const LOCAL_RECIPES_KEY = '@meditrack_local_recipes';
const LOCAL_APPTS_KEY = '@meditrack_local_appointments';

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DOSE_UNITS = [
  { id: 'comp', label: 'Pastilla', icon: 'medical' },
  { id: 'ml', label: 'Líquido / Jarabe', icon: 'water' },
  { id: 'gotas', label: 'Gotas', icon: 'color-fill' },
  { id: 'mg', label: 'Gramos / mg', icon: 'fitness' },
];

const PILL_COLORS = [
  { id: '#38BDF8', name: 'Azul' },
  { id: '#EF4444', name: 'Rojo' },
  { id: '#F59E0B', name: 'Amarillo' },
  { id: '#10B981', name: 'Verde' },
  { id: '#8B5CF6', name: 'Morado' },
  { id: '#EC4899', name: 'Rosado' },
  { id: '#94A3B8', name: 'Blanco / Gris' },
];

const FREQUENCY_OPTIONS = [
  { id: 4, label: 'Cada 4 hrs', perDay: 6 },
  { id: 6, label: 'Cada 6 hrs', perDay: 4 },
  { id: 8, label: 'Cada 8 hrs', perDay: 3 },
  { id: 12, label: 'Cada 12 hrs', perDay: 2 },
  { id: 24, label: 'Una al día (24 hrs)', perDay: 1 },
];

const QUICK_HOURS = [
  { label: '🌅 Mañana (08:00)', time: '08:00' },
  { label: '☀️ Mediodía (13:00)', time: '13:00' },
  { label: '🌇 Tarde (17:00)', time: '17:00' },
  { label: '🌙 Noche (21:00)', time: '21:00' },
];

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function calculateDoseTimes(startTime: string, intervalHours: number): string[] {
  const [hourStr, minuteStr] = (startTime || '08:00').split(':');
  let startHour = parseInt(hourStr, 10);
  const startMin = minuteStr || '00';
  if (isNaN(startHour)) startHour = 8;

  const times: string[] = [];
  const dosesPerDay = Math.floor(24 / intervalHours);

  for (let i = 0; i < dosesPerDay; i++) {
    const currentHour = (startHour + i * intervalHours) % 24;
    times.push(`${String(currentHour).padStart(2, '0')}:${startMin}`);
  }
  return times;
}

function addDaysToDate(baseDateStr: string, days: number): string {
  const base = new Date(baseDateStr + 'T00:00:00');
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const initialRecipeForm = {
  patient: '',
  medication: '',
  dose: '',
  frequency: 'Cada 8 hrs',
  startDate: getTodayString(),
  endDate: addDaysToDate(getTodayString(), 7),
  startTime: '08:00',
  notes: '',
};

const initialAppointmentForm = {
  patient: '',
  doctor: '',
  specialty: '',
  date: getTodayString(),
  time: '10:00',
  location: '',
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getChileTodayString() {
  const parts = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function buildCalendarDays(year: number, month: number) {
  const monthStart = new Date(year, month, 1);
  const startDay = new Date(monthStart);
  startDay.setDate(startDay.getDate() - startDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDay);
    date.setDate(startDay.getDate() + index);
    return date;
  });
}

export default function App() {
  const router = useRouter();
  const { isDarkMode, largeFont } = useTheme();

  const [selectedInterval, setSelectedInterval] = useState<number>(8);
  const [recipeForm, setRecipeForm] = useState(initialRecipeForm);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentUserName, setCurrentUserName] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const [selectedColor, setSelectedColor] = useState(PILL_COLORS[0]);
  const [doseAmount, setDoseAmount] = useState('1');
  const [doseUnit, setDoseUnit] = useState<'comp' | 'ml' | 'mg' | 'gotas'>('comp');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'recipe' | 'appointment'>('recipe');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [pickerTarget, setPickerTarget] = useState<'startDate' | 'endDate' | 'appDate' | null>(null);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  const [showScrollPrompt, setShowScrollPrompt] = useState(true);
  const [showModalScrollPrompt, setShowModalScrollPrompt] = useState(true);

  const todayKey = useMemo(() => getChileTodayString(), []);

  useEffect(() => {
    async function loadUser() {
      const guest = await LocalAuth.isGuestMode();
      setIsGuest(guest);

      if (guest) {
        const name = 'Usuario Local';
        setCurrentUserName(name);
        setRecipeForm((prev) => ({ ...prev, patient: name }));
        setAppointmentForm((prev) => ({ ...prev, patient: name }));
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Paciente';
          setCurrentUserName(name);
          setRecipeForm((prev) => ({ ...prev, patient: name }));
          setAppointmentForm((prev) => ({ ...prev, patient: name }));
        }
      }
    }
    loadUser();
  }, []);

  const monthLabel = `${monthNames[selectedMonth.getMonth()]} De ${selectedMonth.getFullYear()}`;
  const pickerMonthLabel = `${monthNames[pickerMonth.getMonth()]} ${pickerMonth.getFullYear()}`;

  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth.getFullYear(), selectedMonth.getMonth()),
    [selectedMonth]
  );

  const pickerCalendarDays = useMemo(
    () => buildCalendarDays(pickerMonth.getFullYear(), pickerMonth.getMonth()),
    [pickerMonth]
  );

  const upcomingEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const guest = await LocalAuth.isGuestMode();
      setIsGuest(guest);

      if (guest) {
        // Carga directa y segura desde AsyncStorage
        const rawRecipes = await AsyncStorage.getItem(LOCAL_RECIPES_KEY);
        const rawAppts = await AsyncStorage.getItem(LOCAL_APPTS_KEY);

        const localRecipes = rawRecipes ? JSON.parse(rawRecipes) : [];
        const localAppointments = rawAppts ? JSON.parse(rawAppts) : [];

        const parsedRecipes = localRecipes.map((r: any) => ({
          id: `rec-${r.id}`,
          rawId: r.id,
          medication: r.medication,
          title: `${r.medication} (${r.dose || ''})`,
          patient: r.patient || 'Usuario Local',
          date: r.start_date,
          endDate: r.end_date || r.start_date,
          time: r.start_time,
          color: r.color || '#38BDF8',
          colorName: r.color_name || 'Azul',
          dose: r.dose || '',
          frequency: r.frequency || 'Cada 8 hrs',
          notes: r.notes || '',
          type: 'recipe',
        }));

        const parsedAppointments = localAppointments.map((a: any) => ({
          id: `app-${a.id}`,
          rawId: a.id,
          doctor: a.doctor,
          specialty: a.specialty,
          location: a.location,
          title: `Cita: ${a.specialty ? `${a.specialty} (${a.doctor})` : a.doctor}`,
          patient: a.patient || 'Usuario Local',
          date: a.date,
          time: a.time,
          color: '#D97706',
          colorName: 'Ámbar',
          dose: '',
          type: 'appointment',
        }));

        setEvents([...parsedRecipes, ...parsedAppointments]);
      } else {
        // Carga desde Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setEvents([]);
          return;
        }

        const [{ data: recipes, error: rError }, { data: appointments, error: aError }] = await Promise.all([
          supabase.from('recipes').select('*').eq('user_id', user.id),
          supabase.from('appointments').select('*').eq('user_id', user.id)
        ]);

        if (rError) console.error('Error al traer recetas:', rError.message);
        if (aError) console.error('Error al traer citas:', aError.message);

        const parsedRecipes = (recipes || []).map((r) => ({
          id: `rec-${r.id}`,
          rawId: r.id,
          medication: r.medication,
          title: `${r.medication} (${r.dose || ''})`,
          patient: r.patient || currentUserName,
          date: r.start_date,
          endDate: r.end_date || r.start_date,
          time: r.start_time,
          color: r.color || '#38BDF8',
          colorName: r.color_name || 'Azul',
          dose: r.dose || '',
          frequency: r.frequency || 'Cada 8 hrs',
          notes: r.notes || '',
          type: 'recipe',
        }));

        const parsedAppointments = (appointments || []).map((a) => ({
          id: `app-${a.id}`,
          rawId: a.id,
          doctor: a.doctor,
          specialty: a.specialty,
          location: a.location,
          title: `Cita: ${a.specialty ? `${a.specialty} (${a.doctor})` : a.doctor}`,
          patient: a.patient || currentUserName,
          date: a.date,
          time: a.time,
          color: '#D97706',
          colorName: 'Ámbar',
          dose: '',
          type: 'appointment',
        }));

        setEvents([...parsedRecipes, ...parsedAppointments]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 30 && showScrollPrompt) {
      setShowScrollPrompt(false);
    } else if (offsetY <= 10 && !showScrollPrompt) {
      setShowScrollPrompt(true);
    }
  };

  const handleModalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 20 && showModalScrollPrompt) {
      setShowModalScrollPrompt(false);
    } else if (offsetY <= 10 && !showModalScrollPrompt) {
      setShowModalScrollPrompt(true);
    }
  };

  const handleRecipeChange = (name: string, value: string) => {
    setRecipeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentChange = (name: string, value: string) => {
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const adjustRecipeTime = (type: 'hour' | 'minute', amount: number) => {
    const [currentH, currentM] = (recipeForm.startTime || '08:00').split(':').map(Number);
    if (type === 'hour') {
      let nextH = (currentH + amount) % 24;
      if (nextH < 0) nextH = 23;
      handleRecipeChange('startTime', `${String(nextH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
    } else {
      let nextM = (currentM + amount) % 60;
      if (nextM < 0) nextM = 45;
      handleRecipeChange('startTime', `${String(currentH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`);
    }
  };

  const adjustAppointmentTime = (type: 'hour' | 'minute', amount: number) => {
    const [currentH, currentM] = (appointmentForm.time || '10:00').split(':').map(Number);
    if (type === 'hour') {
      let nextH = (currentH + amount) % 24;
      if (nextH < 0) nextH = 23;
      handleAppointmentChange('time', `${String(nextH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
    } else {
      let nextM = (currentM + amount) % 60;
      if (nextM < 0) nextM = 45;
      handleAppointmentChange('time', `${String(currentH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`);
    }
  };

  const handleSelectPickerDate = (dateStr: string) => {
    if (pickerTarget === 'startDate') {
      handleRecipeChange('startDate', dateStr);
      if (dateStr > recipeForm.endDate) {
        handleRecipeChange('endDate', addDaysToDate(dateStr, 7));
      }
    } else if (pickerTarget === 'endDate') {
      handleRecipeChange('endDate', dateStr);
    } else if (pickerTarget === 'appDate') {
      handleAppointmentChange('date', dateStr);
    }
    setPickerTarget(null);
  };

  const openPickerModal = (target: 'startDate' | 'endDate' | 'appDate') => {
    let baseStr = recipeForm.startDate;
    if (target === 'endDate') baseStr = recipeForm.endDate;
    if (target === 'appDate') baseStr = appointmentForm.date;

    const base = new Date((baseStr || getTodayString()) + 'T00:00:00');
    setPickerMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setPickerTarget(target);
  };

  const handleEditEvent = (event: any) => {
    setEditingId(event.rawId);
    setFormType(event.type);

    if (event.type === 'recipe') {
      const parts = (event.dose || '1 comp').split(' ');
      const amount = parts[0] || '1';
      const unit = (parts[1] || 'comp') as any;

      setDoseAmount(amount);
      setDoseUnit(unit);

      const matchedColor = PILL_COLORS.find((c) => c.id === event.color) || PILL_COLORS[0];
      setSelectedColor(matchedColor);

      const matchedFreq = FREQUENCY_OPTIONS.find((f) => f.label === event.frequency);
      if (matchedFreq) {
        setSelectedInterval(matchedFreq.id);
      }

      setRecipeForm({
        patient: event.patient,
        medication: event.medication || '',
        dose: event.dose || '',
        frequency: event.frequency || 'Cada 8 hrs',
        startDate: event.date,
        endDate: event.endDate || event.date,
        startTime: event.time || '08:00',
        notes: event.notes || '',
      });
    } else {
      setAppointmentForm({
        patient: event.patient,
        doctor: event.doctor || '',
        specialty: event.specialty || '',
        date: event.date,
        time: event.time || '10:00',
        location: event.location || '',
      });
    }

    setShowModalScrollPrompt(true);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!editingId) return;

    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro de que deseas borrar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              if (isGuest) {
                if (formType === 'recipe') {
                  const raw = await AsyncStorage.getItem(LOCAL_RECIPES_KEY);
                  const list = raw ? JSON.parse(raw) : [];
                  const updated = list.filter((r: any) => r.id !== editingId);
                  await AsyncStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(updated));
                } else {
                  const raw = await AsyncStorage.getItem(LOCAL_APPTS_KEY);
                  const list = raw ? JSON.parse(raw) : [];
                  const updated = list.filter((a: any) => a.id !== editingId);
                  await AsyncStorage.setItem(LOCAL_APPTS_KEY, JSON.stringify(updated));
                }
              } else {
                const table = formType === 'recipe' ? 'recipes' : 'appointments';
                const { error } = await supabase.from(table).delete().eq('id', editingId);
                if (error) throw error;
              }

              setIsFormOpen(false);
              setEditingId(null);
              await fetchEvents();
            } catch (err: any) {
              Alert.alert('Error al eliminar', err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const guest = await LocalAuth.isGuestMode();
      let activeUserId: string | null = null;

      if (!guest) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Sesión expirada', 'Inicia sesión nuevamente o ingresa en modo local.');
          setSaving(false);
          return;
        }
        activeUserId = user.id;
      }

      if (formType === 'recipe') {
        if (!recipeForm.medication) {
          Alert.alert('Incompleto', 'Indica el nombre del medicamento.');
          setSaving(false);
          return;
        }

        const fullDose = `${doseAmount.trim()} ${doseUnit}`;

        if (guest) {
          // Guardar directamente en AsyncStorage
          const raw = await AsyncStorage.getItem(LOCAL_RECIPES_KEY);
          let list = raw ? JSON.parse(raw) : [];

          const newRecipe = {
            id: editingId || `rec_${Date.now()}`,
            patient: 'Usuario Local',
            medication: recipeForm.medication,
            dose: fullDose,
            color: selectedColor.id,
            color_name: selectedColor.name,
            frequency: recipeForm.frequency,
            start_date: recipeForm.startDate,
            end_date: recipeForm.endDate,
            start_time: recipeForm.startTime,
            notes: recipeForm.notes,
          };

          if (editingId) {
            list = list.map((item: any) => (item.id === editingId ? newRecipe : item));
          } else {
            list.unshift(newRecipe);
          }

          await AsyncStorage.setItem(LOCAL_RECIPES_KEY, JSON.stringify(list));
        } else {
          // Guardar en Supabase
          const payload = {
            user_id: activeUserId,
            patient: currentUserName,
            medication: recipeForm.medication,
            dose: fullDose,
            color: selectedColor.id,
            color_name: selectedColor.name,
            frequency: recipeForm.frequency,
            start_date: recipeForm.startDate,
            end_date: recipeForm.endDate,
            start_time: recipeForm.startTime,
            notes: recipeForm.notes,
          };

          if (editingId) {
            const { error } = await supabase.from('recipes').update(payload).eq('id', editingId);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('recipes').insert([payload]);
            if (error) throw error;
          }
        }

        setRecipeForm({
          ...initialRecipeForm,
          startDate: getTodayString(),
          endDate: addDaysToDate(getTodayString(), 7),
        });
        setDoseAmount('1');
        setSelectedColor(PILL_COLORS[0]);
        setSelectedInterval(8);
      } else {
        if (!appointmentForm.doctor) {
          Alert.alert('Incompleto', 'Indica el nombre del médico.');
          setSaving(false);
          return;
        }

        if (guest) {
          // Guardar cita directamente en AsyncStorage
          const raw = await AsyncStorage.getItem(LOCAL_APPTS_KEY);
          let list = raw ? JSON.parse(raw) : [];

          const newAppt = {
            id: editingId || `app_${Date.now()}`,
            patient: 'Usuario Local',
            doctor: appointmentForm.doctor,
            specialty: appointmentForm.specialty,
            date: appointmentForm.date,
            time: appointmentForm.time,
            location: appointmentForm.location,
          };

          if (editingId) {
            list = list.map((item: any) => (item.id === editingId ? newAppt : item));
          } else {
            list.unshift(newAppt);
          }

          await AsyncStorage.setItem(LOCAL_APPTS_KEY, JSON.stringify(list));
        } else {
          // Guardar cita en Supabase
          const payload = {
            user_id: activeUserId,
            patient: currentUserName,
            doctor: appointmentForm.doctor,
            specialty: appointmentForm.specialty,
            date: appointmentForm.date,
            time: appointmentForm.time,
            location: appointmentForm.location,
          };

          if (editingId) {
            const { error } = await supabase.from('appointments').update(payload).eq('id', editingId);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('appointments').insert([payload]);
            if (error) throw error;
          }
        }

        setAppointmentForm(initialAppointmentForm);
      }

      setIsFormOpen(false);
      setEditingId(null);
      await fetchEvents();
    } catch (err: any) {
      Alert.alert('Error al guardar', err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeMonth = (direction: number) => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1));
  };

  const openModal = (type: 'recipe' | 'appointment') => {
    setEditingId(null);
    setFormType(type);
    if (type === 'recipe') {
      setRecipeForm((prev) => ({
        ...prev,
        patient: currentUserName,
        startDate: getTodayString(),
        endDate: addDaysToDate(getTodayString(), 7),
      }));
    } else {
      setAppointmentForm((prev) => ({ ...prev, patient: currentUserName }));
    }
    setShowModalScrollPrompt(true);
    setIsFormOpen(true);
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && { backgroundColor: '#0F172A' }]}>
      <View style={[styles.headerPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandWrap}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
            <View>
              <Text style={[styles.title, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 26 }]}>
                MediTrack
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile' as any)}>
            <Ionicons name="person-circle" size={45} color={isDarkMode ? '#38BDF8' : '#36B9CC'} />
          </TouchableOpacity>
        </View>

        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openModal('recipe')}>
            <Ionicons name="medical" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryButtonText}>+ Receta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appointmentButton}
            onPress={() => openModal('appointment')}
          >
            <Ionicons name="calendar" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.appointmentButtonText}>+ Cita Médica</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <ScrollView
          style={styles.mainLayout}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle={isDarkMode ? 'white' : 'black'}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.calendarPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={[styles.navButton, isDarkMode && styles.darkNavButton]}
                onPress={() => changeMonth(-1)}
                accessibilityLabel="Mes anterior"
              >
                <Ionicons name="chevron-back" size={26} color={isDarkMode ? '#7DD3FC' : '#FFF'} />
              </TouchableOpacity>

              <Text style={[styles.monthLabel, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 22 }]}>
                {monthLabel}
              </Text>

              <TouchableOpacity
                style={[styles.navButton, isDarkMode && styles.darkNavButton]}
                onPress={() => changeMonth(1)}
                accessibilityLabel="Mes siguiente"
              >
                <Ionicons name="chevron-forward" size={26} color={isDarkMode ? '#7DD3FC' : '#FFF'} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#36B9CC" style={{ paddingVertical: 20 }} />
            ) : (
              <View style={styles.calendarGrid}>
                {weekDays.map((day) => (
                  <View key={day} style={styles.weekdayCell}>
                    <Text style={[styles.weekdayText, isDarkMode && { color: '#CBD5E1' }]}>
                      {day}
                    </Text>
                  </View>
                ))}

                {calendarDays.map((date, index) => {
                  const dateKey = formatDateKey(date);
                  const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();
                  const isToday = dateKey === todayKey;

                  const dayEvents = events.filter((event) => {
                    if (event.type === 'recipe') {
                      const start = event.date;
                      const end = event.endDate || event.date;
                      return dateKey >= start && dateKey <= end;
                    }
                    return event.date === dateKey;
                  });

                  return (
                    <View
                      key={`${dateKey}-${index}`}
                      style={[
                        styles.dayCell,
                        isDarkMode && { borderColor: '#334155' },
                        !isCurrentMonth && (isDarkMode ? { opacity: 0.5 } : styles.mutedDay),
                      ]}
                    >
                      <View style={[styles.dayNumberContainer, isToday && styles.todayBadge]}>
                        <Text
                          style={[
                            styles.dayNumber,
                            isDarkMode && { color: '#F1F5F9' },
                            isToday && styles.todayNumberText,
                            largeFont && { fontSize: 16 },
                          ]}
                        >
                          {String(date.getDate())}
                        </Text>
                      </View>

                      {dayEvents.map((event) => {
                        const isAppointment = event.type === 'appointment';
                        return (
                          <TouchableOpacity
                            key={`${event.id}-${dateKey}`}
                            style={[
                              styles.eventPill,
                              isAppointment
                                ? styles.appointmentPill
                                : { backgroundColor: event.color }
                            ]}
                            onPress={() => handleEditEvent(event)}
                            activeOpacity={0.8}
                          >
                            {isAppointment && (
                              <Ionicons name="calendar" size={9} color="#78350F" style={{ marginRight: 3 }} />
                            )}
                            <Text
                              style={[
                                styles.eventPillText,
                                isAppointment && styles.appointmentPillText
                              ]}
                              numberOfLines={1}
                            >
                              {event.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Zona Próximas Atenciones */}
          <View style={[styles.agendaPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: '#8A2BE2' }]} />
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 22 }]}>
                Próximas atenciones
              </Text>
            </View>
            {upcomingEvents.length === 0 && !loading && (
              <Text style={[{ color: '#475569', fontSize: 15, fontWeight: '500' }, isDarkMode && { color: '#CBD5E1' }]}>
                No hay registros próximos.
              </Text>
            )}
            {upcomingEvents.slice(0, 8).map((event) => {
              const isAppointment = event.type === 'appointment';
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.agendaItem,
                    isAppointment && styles.appointmentAgendaCard,
                    isDarkMode && { backgroundColor: isAppointment ? '#451A03' : '#0F172A' },
                    isDarkMode && isAppointment && { borderColor: '#B45309' }
                  ]}
                  onPress={() => handleEditEvent(event)}
                  activeOpacity={0.7}
                >
                  {isAppointment ? (
                    <View style={styles.appointmentBadgeIcon}>
                      <Ionicons name="calendar-sharp" size={18} color="#B45309" />
                    </View>
                  ) : (
                    <View style={[styles.agendaBullet, { backgroundColor: event.color }]} />
                  )}

                  <View style={styles.agendaInfo}>
                    <View style={styles.agendaTitleRow}>
                      <View style={styles.agendaTitleLeft}>
                        {isAppointment && (
                          <View style={styles.appointmentTag}>
                            <Text style={styles.appointmentTagText}>CITA MÉDICA</Text>
                          </View>
                        )}
                        <Text
                          style={[
                            styles.agendaTitle,
                            isAppointment && { color: isDarkMode ? '#FDE68A' : '#92400E' },
                            isDarkMode && !isAppointment && { color: '#F1F5F9' },
                            largeFont && { fontSize: 18 }
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {event.title}
                        </Text>
                      </View>
                      <Ionicons
                        name="pencil-sharp"
                        size={16}
                        color={isAppointment ? '#D97706' : isDarkMode ? '#38BDF8' : '#36B9CC'}
                        style={styles.agendaPencilIcon}
                      />
                    </View>
                    <Text style={[styles.agendaTime, isDarkMode && { color: '#94A3B8' }, largeFont && { fontSize: 15 }]}>
                      {event.type === 'recipe' && event.colorName ? `Envase/Pastilla: ${event.colorName} • ` : ''}
                      {event.time} - {event.date} {event.endDate ? `al ${event.endDate}` : ''} ({event.patient})
                      {event.location ? ` • Lugar: ${event.location}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Indicador inferior accesible */}
        {showScrollPrompt && (
          <View pointerEvents="none" style={styles.floatingPromptContainer}>
            <View style={[styles.floatingPromptPill, isDarkMode && styles.floatingPromptDark]}>
              <Ionicons name="arrow-down-circle" size={22} color="#FFF" />
              <Text style={styles.floatingPromptText}>
                Baja para ver más atenciones
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal de Ingreso / Edición */}
      <Modal visible={isFormOpen} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={formType === 'recipe' ? 'medical' : 'calendar'}
                  size={24}
                  color={formType === 'recipe' ? '#36B9CC' : '#D97706'}
                />
                <Text style={[styles.modalTitle, isDarkMode && { color: '#F1F5F9' }]}>
                  {editingId
                    ? (formType === 'recipe' ? 'Editar Receta' : 'Editar Cita Médica')
                    : (formType === 'recipe' ? 'Nueva Receta' : 'Nueva Cita Médica')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Text style={[styles.closeButton, isDarkMode && { color: '#94A3B8' }]}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexShrink: 1, position: 'relative' }}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                indicatorStyle={isDarkMode ? 'white' : 'black'}
                onScroll={handleModalScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 35 }}
              >
                <View style={styles.formGroup}>
                  {formType === 'recipe' ? (
                    <>
                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Paciente</Text>
                      <View style={[styles.readOnlyUserBox, isDarkMode && styles.darkReadOnlyBox]}>
                        <Ionicons
                          name={isGuest ? "phone-portrait" : "person-circle"}
                          size={24}
                          color="#36B9CC"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.readOnlyUserText, isDarkMode && styles.darkText]}>
                          {isGuest ? 'Modo Local (Sin cuenta)' : (currentUserName || 'Cargando...')}
                        </Text>
                      </View>

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Medicamento</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        placeholder="Ej. Paracetamol"
                        placeholderTextColor="#94A3B8"
                        value={recipeForm.medication}
                        onChangeText={(t) => handleRecipeChange('medication', t)}
                      />

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Forma de administración</Text>
                      <View style={styles.unitSelectorGrid}>
                        {DOSE_UNITS.map((u) => {
                          const isSelected = doseUnit === u.id;
                          return (
                            <TouchableOpacity
                              key={u.id}
                              style={[
                                styles.unitOptionCard,
                                isDarkMode && styles.darkUnitCard,
                                isSelected && styles.unitOptionSelected
                              ]}
                              onPress={() => setDoseUnit(u.id as any)}
                            >
                              <Ionicons
                                name={u.icon as any}
                                size={20}
                                color={isSelected ? '#FFF' : isDarkMode ? '#38BDF8' : '#36B9CC'}
                              />
                              <Text style={[styles.unitOptionText, isSelected && { color: '#FFF' }]}>
                                {u.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>
                        Color pastilla/envase: <Text style={{ color: selectedColor.id, fontWeight: 'bold' }}>{selectedColor.name}</Text>
                      </Text>
                      <View style={styles.colorPaletteRow}>
                        {PILL_COLORS.map((c) => {
                          const isChosen = selectedColor.id === c.id;
                          return (
                            <TouchableOpacity
                              key={c.id}
                              style={[
                                styles.colorCircle,
                                { backgroundColor: c.id },
                                isChosen && styles.colorCircleActive
                              ]}
                              onPress={() => setSelectedColor(c)}
                            />
                          );
                        })}
                      </View>

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>
                        Cantidad ({doseUnit})
                      </Text>
                      <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        placeholder="Ej. 1"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={doseAmount}
                        onChangeText={setDoseAmount}
                      />

                      {/* Selector táctil accesible para la primera toma */}
                      <Text style={[styles.label, isDarkMode && styles.darkSubtext, { marginTop: 4 }]}>
                        Hora de la primera toma
                      </Text>
                      <View style={[styles.timePickerContainer, isDarkMode && styles.darkTimePickerContainer]}>
                        <View style={styles.timeStepperGroup}>
                          <Text style={[styles.stepperSubtext, isDarkMode && { color: '#94A3B8' }]}>HORA</Text>
                          <View style={styles.stepperRow}>
                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustRecipeTime('hour', -1)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="remove" size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                            </TouchableOpacity>

                            <Text style={[styles.stepperNumber, isDarkMode && { color: '#F1F5F9' }]}>
                              {(recipeForm.startTime || '08:00').split(':')[0]}
                            </Text>

                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustRecipeTime('hour', 1)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="add" size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={[styles.timeSeparator, isDarkMode && { color: '#64748B' }]}>:</Text>

                        <View style={styles.timeStepperGroup}>
                          <Text style={[styles.stepperSubtext, isDarkMode && { color: '#94A3B8' }]}>MINUTOS</Text>
                          <View style={styles.stepperRow}>
                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustRecipeTime('minute', -15)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="remove" size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                            </TouchableOpacity>

                            <Text style={[styles.stepperNumber, isDarkMode && { color: '#F1F5F9' }]}>
                              {(recipeForm.startTime || '08:00').split(':')[1]}
                            </Text>

                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustRecipeTime('minute', 15)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="add" size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      <Text style={[styles.miniSubLabel, isDarkMode && styles.darkSubtext, { marginTop: 10 }]}>
                        O elige un horario habitual:
                      </Text>
                      <View style={styles.quickDurationRow}>
                        {QUICK_HOURS.map((q) => {
                          const isChosen = recipeForm.startTime === q.time;
                          return (
                            <TouchableOpacity
                              key={q.time}
                              style={[
                                styles.quickHourChip,
                                isDarkMode && styles.darkQuickHourChip,
                                isChosen && styles.quickHourChipActive
                              ]}
                              onPress={() => handleRecipeChange('startTime', q.time)}
                            >
                              <Text style={[
                                styles.quickHourChipText,
                                isDarkMode && { color: '#38BDF8' },
                                isChosen && { color: '#FFFFFF', fontWeight: 'bold' }
                              ]}>
                                {q.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext, { marginTop: 8 }]}>
                        Frecuencia de toma
                      </Text>
                      <View style={styles.frequencyRow}>
                        {FREQUENCY_OPTIONS.map((f) => {
                          const isSelected = selectedInterval === f.id;
                          return (
                            <TouchableOpacity
                              key={f.id}
                              style={[
                                styles.freqChip,
                                isDarkMode && styles.darkFreqChip,
                                isSelected && styles.freqChipSelected,
                              ]}
                              onPress={() => {
                                setSelectedInterval(f.id);
                                handleRecipeChange('frequency', f.label);
                              }}
                            >
                              <Text style={[styles.freqChipText, isSelected && { color: '#FFF' }]}>
                                {f.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={[styles.schedulePreviewBox, isDarkMode && styles.darkScheduleBox]}>
                        <Ionicons name="time-outline" size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                        <Text style={[styles.schedulePreviewText, isDarkMode && { color: '#F1F5F9' }]}>
                          Tomas al día: {calculateDoseTimes(recipeForm.startTime, selectedInterval).join('  •  ')}
                        </Text>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Desde (Inicio)</Text>
                          <TouchableOpacity
                            style={[styles.dateTriggerButton, isDarkMode && styles.darkDateTrigger]}
                            onPress={() => openPickerModal('startDate')}
                          >
                            <Ionicons name="calendar-outline" size={18} color="#36B9CC" />
                            <Text style={[styles.dateTriggerText, isDarkMode && { color: '#F1F5F9' }]}>
                              {recipeForm.startDate}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.halfWidth}>
                          <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Hasta (Término)</Text>
                          <TouchableOpacity
                            style={[styles.dateTriggerButton, isDarkMode && styles.darkDateTrigger]}
                            onPress={() => openPickerModal('endDate')}
                          >
                            <Ionicons name="calendar-outline" size={18} color="#36B9CC" />
                            <Text style={[styles.dateTriggerText, isDarkMode && { color: '#F1F5F9' }]}>
                              {recipeForm.endDate}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={[styles.miniSubLabel, isDarkMode && styles.darkSubtext]}>
                        Duración rápida del tratamiento:
                      </Text>
                      <View style={styles.quickDurationRow}>
                        {[
                          { label: '3 días', days: 3 },
                          { label: '5 días', days: 5 },
                          { label: '7 días', days: 7 },
                          { label: '14 días', days: 14 },
                          { label: '30 días', days: 30 },
                        ].map((d) => (
                          <TouchableOpacity
                            key={d.days}
                            style={[styles.durationChip, isDarkMode && styles.darkDurationChip]}
                            onPress={() => handleRecipeChange('endDate', addDaysToDate(recipeForm.startDate, d.days))}
                          >
                            <Text style={[styles.durationChipText, isDarkMode && { color: '#38BDF8' }]}>
                              +{d.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Paciente</Text>
                      <View style={[styles.readOnlyUserBox, isDarkMode && styles.darkReadOnlyBox]}>
                        <Ionicons
                          name={isGuest ? "phone-portrait" : "person-circle"}
                          size={24}
                          color="#D97706"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.readOnlyUserText, isDarkMode && styles.darkText]}>
                          {isGuest ? 'Modo Local (Sin cuenta)' : (currentUserName || 'Cargando...')}
                        </Text>
                      </View>

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Médico Tratante</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        placeholder="Ej. Dra. Gómez"
                        placeholderTextColor="#94A3B8"
                        value={appointmentForm.doctor}
                        onChangeText={(t) => handleAppointmentChange('doctor', t)}
                      />

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Especialidad</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        placeholder="Ej. Cardiología / Control general"
                        placeholderTextColor="#94A3B8"
                        value={appointmentForm.specialty}
                        onChangeText={(t) => handleAppointmentChange('specialty', t)}
                      />

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Lugar o Centro Médico</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && styles.darkInput]}
                        placeholder="Ej. Hospital Puerto Montt / Box 4"
                        placeholderTextColor="#94A3B8"
                        value={appointmentForm.location}
                        onChangeText={(t) => handleAppointmentChange('location', t)}
                      />

                      <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Fecha Cita</Text>
                      <TouchableOpacity
                        style={[styles.dateTriggerButton, isDarkMode && styles.darkDateTrigger]}
                        onPress={() => openPickerModal('appDate')}
                      >
                        <Ionicons name="calendar-outline" size={18} color="#D97706" />
                        <Text style={[styles.dateTriggerText, isDarkMode && { color: '#F1F5F9' }]}>
                          {appointmentForm.date}
                        </Text>
                      </TouchableOpacity>

                      {/* Selector táctil accesible para la hora de la cita */}
                      <Text style={[styles.label, isDarkMode && styles.darkSubtext, { marginTop: 4 }]}>
                        Hora de la Cita
                      </Text>
                      <View style={[styles.timePickerContainer, isDarkMode && styles.darkTimePickerContainer]}>
                        <View style={styles.timeStepperGroup}>
                          <Text style={[styles.stepperSubtext, isDarkMode && { color: '#94A3B8' }]}>HORA</Text>
                          <View style={styles.stepperRow}>
                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustAppointmentTime('hour', -1)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="remove" size={24} color="#D97706" />
                            </TouchableOpacity>

                            <Text style={[styles.stepperNumber, isDarkMode && { color: '#F1F5F9' }]}>
                              {(appointmentForm.time || '10:00').split(':')[0]}
                            </Text>

                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustAppointmentTime('hour', 1)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="add" size={24} color="#D97706" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={[styles.timeSeparator, isDarkMode && { color: '#64748B' }]}>:</Text>

                        <View style={styles.timeStepperGroup}>
                          <Text style={[styles.stepperSubtext, isDarkMode && { color: '#94A3B8' }]}>MINUTOS</Text>
                          <View style={styles.stepperRow}>
                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustAppointmentTime('minute', -15)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="remove" size={24} color="#D97706" />
                            </TouchableOpacity>

                            <Text style={[styles.stepperNumber, isDarkMode && { color: '#F1F5F9' }]}>
                              {(appointmentForm.time || '10:00').split(':')[1]}
                            </Text>

                            <TouchableOpacity
                              style={[styles.stepperBtn, isDarkMode && styles.darkStepperBtn]}
                              onPress={() => adjustAppointmentTime('minute', 15)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="add" size={24} color="#D97706" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      formType === 'appointment' && { backgroundColor: '#D97706' }
                    ]}
                    onPress={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {editingId
                          ? (isGuest ? 'Actualizar en Teléfono' : 'Actualizar en Supabase')
                          : (isGuest ? 'Guardar en Teléfono' : 'Guardar en Supabase')}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {editingId && (
                    <TouchableOpacity
                      style={[styles.deleteButton, saving && { opacity: 0.5 }]}
                      onPress={handleDelete}
                      disabled={saving}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text style={styles.deleteButtonText}>Eliminar este registro</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              {/* Indicador flotante en el modal para avisar que falta contenido por ver */}
              {showModalScrollPrompt && (
                <View pointerEvents="none" style={styles.floatingPromptContainer}>
                  <View style={[styles.floatingPromptPill, isDarkMode && styles.floatingPromptDark]}>
                    <Ionicons name="arrow-down-circle" size={22} color="#FFF" />
                    <Text style={styles.floatingPromptText}>
                      Baja para ver más datos y guardar
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Mini-modal interactivo para seleccionar el día */}
      <Modal visible={pickerTarget !== null} transparent={true} animationType="fade">
        <View style={styles.pickerBackdrop}>
          <View style={[styles.pickerDialog, isDarkMode && { backgroundColor: '#1E293B' }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, isDarkMode && { color: '#F1F5F9' }]}>
                {pickerTarget === 'startDate' ? 'Elegir día de inicio' : pickerTarget === 'endDate' ? 'Elegir día de término' : 'Elegir fecha de cita'}
              </Text>
              <TouchableOpacity onPress={() => setPickerTarget(null)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerMonthNav}>
              <TouchableOpacity
                style={[styles.pickerNavBtn, isDarkMode && { backgroundColor: '#334155' }]}
                onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
              >
                <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#38BDF8' : '#36B9CC'} />
              </TouchableOpacity>

              <Text style={[styles.pickerMonthText, isDarkMode && { color: '#F1F5F9' }]}>
                {pickerMonthLabel}
              </Text>

              <TouchableOpacity
                style={[styles.pickerNavBtn, isDarkMode && { backgroundColor: '#334155' }]}
                onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#38BDF8' : '#36B9CC'} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerGrid}>
              {weekDays.map((d) => (
                <View key={d} style={styles.pickerDayCell}>
                  <Text style={[styles.pickerWeekdayText, isDarkMode && { color: '#64748B' }]}>{d}</Text>
                </View>
              ))}

              {pickerCalendarDays.map((dt, idx) => {
                const dateKey = formatDateKey(dt);
                const isCurrentMonth = dt.getMonth() === pickerMonth.getMonth();

                let isSelected = false;
                if (pickerTarget === 'startDate') isSelected = dateKey === recipeForm.startDate;
                if (pickerTarget === 'endDate') isSelected = dateKey === recipeForm.endDate;
                if (pickerTarget === 'appDate') isSelected = dateKey === appointmentForm.date;

                return (
                  <TouchableOpacity
                    key={`${dateKey}-${idx}`}
                    style={[
                      styles.pickerDayCell,
                      isSelected && styles.pickerDayCellSelected,
                      !isCurrentMonth && { opacity: 0.25 }
                    ]}
                    onPress={() => handleSelectPickerDate(dateKey)}
                  >
                    <Text style={[
                      styles.pickerDayNumber,
                      isDarkMode && { color: '#F1F5F9' },
                      isSelected && { color: '#FFF', fontWeight: 'bold' }
                    ]}>
                      {dt.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF6F6' },
  readOnlyUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BCE5E5',
  },
  darkReadOnlyBox: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  readOnlyUserText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#102A43',
  },
  darkText: { color: '#F1F5F9' },
  darkSubtext: { color: '#94A3B8' },
  headerPanel: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    margin: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  brandWrap: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    backgroundColor: '#36B9CC',
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  brandMarkText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#102A43' },
  iconButton: { justifyContent: 'center', alignItems: 'center' },
  topbarActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  primaryButton: {
    backgroundColor: '#007791',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  appointmentButton: {
    backgroundColor: '#C85A17',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentButtonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  mainLayout: { flex: 1, paddingHorizontal: 15 },
  calendarPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15 },
  calendarActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  navButton: {
    backgroundColor: '#007791',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkNavButton: {
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  monthLabel: { fontSize: 18, fontWeight: 'bold', color: '#102A43' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 2,
  },
  todayBadge: { backgroundColor: '#0EA5E9' },
  todayNumberText: { color: '#FFFFFF', fontWeight: 'bold' },
  weekdayCell: { width: '14.28%', alignItems: 'center', marginBottom: 10 },
  weekdayText: { color: '#334155', fontSize: 13, fontWeight: '700' },
  dayCell: {
    width: '14.28%',
    minHeight: 65,
    paddingHorizontal: 2,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderColor: '#F0F4F8',
    justifyContent: 'flex-start',
  },
  mutedDay: { opacity: 0.55 },
  dayNumber: { fontSize: 14, color: '#102A43', marginBottom: 2 },
  eventPill: {
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginBottom: 2,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventPillText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  appointmentPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  appointmentPillText: {
    color: '#78350F',
    fontWeight: '800',
  },
  agendaPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#102A43' },
  agendaItem: {
    backgroundColor: '#F9FBFC',
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  appointmentAgendaCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderLeftWidth: 5,
    borderLeftColor: '#D97706',
  },
  appointmentBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appointmentTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  agendaBullet: { width: 15, height: 15, borderRadius: 7.5, marginRight: 15 },
  agendaInfo: {
    flex: 1,
    minWidth: 0,
  },
  agendaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  agendaTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#102A43',
    flexShrink: 1,
  },
  agendaPencilIcon: {
    marginLeft: 8,
    flexShrink: 0,
  },
  agendaTime: { fontSize: 14, color: '#6B8E9B', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#102A43' },
  closeButton: { fontSize: 30, color: '#6B8E9B' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#102A43', marginBottom: 5 },
  input: { backgroundColor: '#F0F4F8', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15, color: '#102A43' },
  darkInput: { backgroundColor: '#334155', color: '#F1F5F9' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  submitButton: { backgroundColor: '#36B9CC', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  unitSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  unitOptionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  darkUnitCard: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  unitOptionSelected: {
    backgroundColor: '#36B9CC',
    borderColor: '#36B9CC',
  },
  unitOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#102A43',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#0284C7',
    transform: [{ scale: 1.18 }],
  },
  miniSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  quickDurationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  durationChip: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  darkDurationChip: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  freqChip: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkFreqChip: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  freqChipSelected: {
    backgroundColor: '#36B9CC',
    borderColor: '#36B9CC',
  },
  freqChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102A43',
  },
  schedulePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  darkScheduleBox: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  schedulePreviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    flex: 1,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  darkTimePickerContainer: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  timeStepperGroup: {
    alignItems: 'center',
    flex: 1,
  },
  stepperSubtext: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  darkStepperBtn: {
    backgroundColor: '#334155',
  },
  stepperNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '900',
    color: '#94A3B8',
    marginHorizontal: 8,
    marginTop: 18,
  },
  quickHourChip: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  darkQuickHourChip: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  quickHourChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  quickHourChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  dateTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkDateTrigger: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  dateTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#102A43',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerDialog: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#102A43',
  },
  pickerMonthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerNavBtn: {
    backgroundColor: '#F0F4F8',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#102A43',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerDayCell: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginVertical: 2,
  },
  pickerDayCellSelected: {
    backgroundColor: '#D97706',
  },
  pickerWeekdayText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  pickerDayNumber: {
    fontSize: 13,
    color: '#102A43',
  },
  floatingPromptContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007791',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
      android: { elevation: 5 },
    }),
  },
  floatingPromptDark: {
    backgroundColor: '#0369A1',
  },
  floatingPromptText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
});
