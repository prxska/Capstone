import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Modal, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

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
  frequency: 'Cada 8 horas',
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

  const [recipeForm, setRecipeForm] = useState(initialRecipeForm);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentUserName, setCurrentUserName] = useState('');

  const [selectedColor, setSelectedColor] = useState(PILL_COLORS[0]);
  const [doseAmount, setDoseAmount] = useState('1');
  const [doseUnit, setDoseUnit] = useState<'comp' | 'ml' | 'mg' | 'gotas'>('comp');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'recipe' | 'appointment'>('recipe');

  const todayKey = useMemo(() => getChileTodayString(), []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Paciente';
        setCurrentUserName(name);
        setRecipeForm((prev) => ({ ...prev, patient: name }));
        setAppointmentForm((prev) => ({ ...prev, patient: name }));
      }
    }
    loadUser();
  }, []);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthLabel = `${monthNames[selectedMonth.getMonth()]} De ${selectedMonth.getFullYear()}`;

  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth.getFullYear(), selectedMonth.getMonth()),
    [selectedMonth]
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
      const { data: { user } } = await supabase.auth.getUser();
      const activeName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

      if (!activeName) {
        setEvents([]);
        return;
      }

      const [{ data: recipes, error: rError }, { data: appointments, error: aError }] = await Promise.all([
        supabase.from('recipes').select('*').eq('patient', activeName),
        supabase.from('appointments').select('*').eq('patient', activeName)
      ]);

      if (rError) console.error('Error al traer recetas:', rError.message);
      if (aError) console.error('Error al traer citas:', aError.message);

      const parsedRecipes = (recipes || []).map((r) => ({
        id: `rec-${r.id}`,
        title: `${r.medication} (${r.dose || ''})`,
        patient: r.patient,
        date: r.start_date,
        endDate: r.end_date,
        time: r.start_time,
        color: r.color || '#38BDF8',
        colorName: r.color_name || 'Azul',
        dose: r.dose || '',
        type: 'recipe',
      }));

      const parsedAppointments = (appointments || []).map((a) => ({
        id: `app-${a.id}`,
        title: `Cita: ${a.specialty || a.doctor}`,
        patient: a.patient,
        date: a.date,
        time: a.time,
        color: '#F43F5E',
        colorName: '',
        dose: '',
        type: 'appointment',
      }));

      setEvents([...parsedRecipes, ...parsedAppointments]);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudieron cargar los datos de Supabase.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRecipeChange = (name: string, value: string) => {
    setRecipeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentChange = (name: string, value: string) => {
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (formType === 'recipe') {
        if (!recipeForm.medication || !currentUserName) {
          Alert.alert('Incompleto', 'Indica paciente y medicamento.');
          setSaving(false);
          return;
        }

        const fullDose = `${doseAmount.trim()} ${doseUnit}`;

        const { error } = await supabase.from('recipes').insert([{
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
        }]);

        if (error) throw error;
        setRecipeForm({
          ...initialRecipeForm,
          startDate: getTodayString(),
          endDate: addDaysToDate(getTodayString(), 7),
        });
        setDoseAmount('1');
        setSelectedColor(PILL_COLORS[0]);
      } else {
        if (!appointmentForm.doctor || !currentUserName) {
          Alert.alert('Incompleto', 'Indica paciente y médico.');
          setSaving(false);
          return;
        }

        const { error } = await supabase.from('appointments').insert([{
          patient: currentUserName,
          doctor: appointmentForm.doctor,
          specialty: appointmentForm.specialty,
          date: appointmentForm.date,
          time: appointmentForm.time,
          location: appointmentForm.location,
        }]);

        if (error) throw error;
        setAppointmentForm(initialAppointmentForm);
      }

      setIsFormOpen(false);
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
            <Text style={styles.primaryButtonText}>+ Receta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isDarkMode && { backgroundColor: '#334155', borderColor: '#38BDF8' }]}
            onPress={() => openModal('appointment')}
          >
            <Text style={[styles.secondaryButtonText, isDarkMode && { color: '#38BDF8' }]}>
              + Cita Médica
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainLayout} showsVerticalScrollIndicator={false}>
        <View style={[styles.calendarPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
          <View style={styles.calendarActions}>
            <TouchableOpacity
              style={[styles.navButton, isDarkMode && { backgroundColor: '#334155' }]}
              onPress={() => changeMonth(-1)}
            >
              <Text style={[styles.navButtonText, isDarkMode && { color: '#38BDF8' }]}>‹</Text>
            </TouchableOpacity>

            <Text style={[styles.monthLabel, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 22 }]}>
              {monthLabel}
            </Text>

            <TouchableOpacity
              style={[styles.navButton, isDarkMode && { backgroundColor: '#334155' }]}
              onPress={() => changeMonth(1)}
            >
              <Text style={[styles.navButtonText, isDarkMode && { color: '#38BDF8' }]}>›</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#36B9CC" style={{ paddingVertical: 20 }} />
          ) : (
            <View style={styles.calendarGrid}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, isDarkMode && { color: '#94A3B8' }]}>
                    {day}
                  </Text>
                </View>
              ))}

              {calendarDays.map((date, index) => {
                const dateKey = formatDateKey(date);
                const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();
                const isToday = dateKey === todayKey;
                const dayEvents = events.filter((event) => event.date === dateKey);

                return (
                  <View
                    key={`${dateKey}-${index}`}
                    style={[
                      styles.dayCell,
                      isDarkMode && { borderColor: '#334155' },
                      !isCurrentMonth && (isDarkMode ? { opacity: 0.25 } : styles.mutedDay),
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

                    {dayEvents.slice(0, 2).map((event) => (
                      <View
                        key={String(event.id)}
                        style={[styles.eventPill, { backgroundColor: event.color }]}
                      >
                        <Text style={styles.eventPillText} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.agendaPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.dot, { backgroundColor: '#8A2BE2' }]} />
            <Text style={[styles.sectionTitle, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 22 }]}>
              Próximas atenciones
            </Text>
          </View>
          {upcomingEvents.length === 0 && !loading && (
            <Text style={[{ color: '#6B8E9B', fontStyle: 'italic' }, isDarkMode && { color: '#94A3B8' }]}>
              No hay registros próximos en la base de datos.
            </Text>
          )}
          {upcomingEvents.slice(0, 5).map((event) => (
            <View key={event.id} style={[styles.agendaItem, isDarkMode && { backgroundColor: '#0F172A' }]}>
              <View style={[styles.agendaBullet, { backgroundColor: event.color }]} />
              <View style={styles.agendaInfo}>
                <Text style={[styles.agendaTitle, isDarkMode && { color: '#F1F5F9' }, largeFont && { fontSize: 18 }]}>
                  {event.title}
                </Text>
                <Text style={[styles.agendaTime, isDarkMode && { color: '#94A3B8' }, largeFont && { fontSize: 15 }]}>
                  {event.type === 'recipe' && event.colorName ? `Envase/Pastilla: ${event.colorName} • ` : ''}
                  {event.time} - {event.date} {event.endDate ? `al ${event.endDate}` : ''} ({event.patient})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal de Ingreso */}
      <Modal visible={isFormOpen} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, isDarkMode && { backgroundColor: '#1E293B' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && { color: '#F1F5F9' }]}>
                {formType === 'recipe' ? 'Nueva Receta' : 'Nueva Cita Médica'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Text style={[styles.closeButton, isDarkMode && { color: '#94A3B8' }]}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                {formType === 'recipe' ? (
                  <>
                    <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Paciente</Text>
                    <View style={[styles.readOnlyUserBox, isDarkMode && styles.darkReadOnlyBox]}>
                      <Ionicons name="person-circle" size={24} color="#36B9CC" style={{ marginRight: 8 }} />
                      <Text style={[styles.readOnlyUserText, isDarkMode && styles.darkText]}>
                        {currentUserName || 'Cargando...'}
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

                    {/* Selector de Forma de Administración */}
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

                    {/* Selector de Color de Pastilla o Envase */}
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

                    <View style={styles.row}>
                      <View style={styles.halfWidth}>
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
                      </View>
                      <View style={styles.halfWidth}>
                        <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Hora (HH:MM)</Text>
                        <TextInput
                          style={[styles.input, isDarkMode && styles.darkInput]}
                          placeholder="08:00"
                          placeholderTextColor="#94A3B8"
                          value={recipeForm.startTime}
                          onChangeText={(t) => handleRecipeChange('startTime', t)}
                        />
                      </View>
                    </View>

                    {/* Rango de Fechas Accesible */}
                    <View style={styles.row}>
                      <View style={styles.halfWidth}>
                        <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Desde (Inicio)</Text>
                        {Platform.OS === 'web' ? (
                          <input
                            type="date"
                            value={recipeForm.startDate}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              handleRecipeChange('startDate', newStart);
                              if (newStart > recipeForm.endDate) {
                                handleRecipeChange('endDate', addDaysToDate(newStart, 7));
                              }
                            }}
                            style={{
                              backgroundColor: isDarkMode ? '#334155' : '#F0F4F8',
                              color: isDarkMode ? '#F1F5F9' : '#102A43',
                              border: 'none',
                              borderRadius: 10,
                              padding: 14,
                              fontSize: 15,
                              fontFamily: 'inherit',
                              width: '100%',
                              outline: 'none',
                              marginBottom: 15,
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor="#94A3B8"
                            value={recipeForm.startDate}
                            onChangeText={(t) => handleRecipeChange('startDate', t)}
                          />
                        )}
                      </View>

                      <View style={styles.halfWidth}>
                        <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Hasta (Término)</Text>
                        {Platform.OS === 'web' ? (
                          <input
                            type="date"
                            min={recipeForm.startDate}
                            value={recipeForm.endDate}
                            onChange={(e) => handleRecipeChange('endDate', e.target.value)}
                            style={{
                              backgroundColor: isDarkMode ? '#334155' : '#F0F4F8',
                              color: isDarkMode ? '#F1F5F9' : '#102A43',
                              border: 'none',
                              borderRadius: 10,
                              padding: 14,
                              fontSize: 15,
                              fontFamily: 'inherit',
                              width: '100%',
                              outline: 'none',
                              marginBottom: 15,
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor="#94A3B8"
                            value={recipeForm.endDate}
                            onChangeText={(t) => handleRecipeChange('endDate', t)}
                          />
                        )}
                      </View>
                    </View>

                    {/* Atajos de duración rápida */}
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
                      <Ionicons name="person-circle" size={24} color="#36B9CC" style={{ marginRight: 8 }} />
                      <Text style={[styles.readOnlyUserText, isDarkMode && styles.darkText]}>
                        {currentUserName || 'Cargando...'}
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

                    <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Especialidad o Centro</Text>
                    <TextInput
                      style={[styles.input, isDarkMode && styles.darkInput]}
                      placeholder="Ej. Pediatría"
                      placeholderTextColor="#94A3B8"
                      value={appointmentForm.specialty}
                      onChangeText={(t) => handleAppointmentChange('specialty', t)}
                    />

                    <View style={styles.row}>
                      <View style={styles.halfWidth}>
                        <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Fecha Cita</Text>
                        {Platform.OS === 'web' ? (
                          <input
                            type="date"
                            value={appointmentForm.date}
                            onChange={(e) => handleAppointmentChange('date', e.target.value)}
                            style={{
                              backgroundColor: isDarkMode ? '#334155' : '#F0F4F8',
                              color: isDarkMode ? '#F1F5F9' : '#102A43',
                              border: 'none',
                              borderRadius: 10,
                              padding: 14,
                              fontSize: 15,
                              fontFamily: 'inherit',
                              width: '100%',
                              outline: 'none',
                              marginBottom: 15,
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor="#94A3B8"
                            value={appointmentForm.date}
                            onChangeText={(t) => handleAppointmentChange('date', t)}
                          />
                        )}
                      </View>
                      <View style={styles.halfWidth}>
                        <Text style={[styles.label, isDarkMode && styles.darkSubtext]}>Hora (HH:MM)</Text>
                        <TextInput
                          style={[styles.input, isDarkMode && styles.darkInput]}
                          placeholder="10:00"
                          placeholderTextColor="#94A3B8"
                          value={appointmentForm.time}
                          onChangeText={(t) => handleAppointmentChange('time', t)}
                        />
                      </View>
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
                  {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Guardar en Supabase</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    backgroundColor: '#36B9CC',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  secondaryButton: {
    backgroundColor: '#F0F4F8',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#36B9CC',
  },
  secondaryButtonText: { color: '#36B9CC', fontWeight: 'bold', fontSize: 14 },
  mainLayout: { flex: 1, paddingHorizontal: 15 },
  calendarPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15 },
  calendarActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  navButton: {
    backgroundColor: '#EAF6F6',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: { fontSize: 20, color: '#36B9CC' },
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
  weekdayText: { color: '#6B8E9B', fontSize: 12, fontWeight: 'bold' },
  dayCell: { width: '14.28%', height: 60, padding: 2, borderTopWidth: 1, borderColor: '#F0F4F8' },
  mutedDay: { opacity: 0.3 },
  dayNumber: { fontSize: 14, color: '#102A43', marginBottom: 2 },
  eventPill: { borderRadius: 4, paddingHorizontal: 2, paddingVertical: 1, marginBottom: 2 },
  eventPillText: { fontSize: 8, color: '#FFF', fontWeight: 'bold' },
  agendaPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#102A43' },
  agendaItem: {
    backgroundColor: '#F9FBFC',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  agendaBullet: { width: 15, height: 15, borderRadius: 7.5, marginRight: 15 },
  agendaInfo: { flex: 1 },
  agendaTitle: { fontSize: 16, fontWeight: 'bold', color: '#102A43' },
  agendaTime: { fontSize: 14, color: '#6B8E9B', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
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
});
