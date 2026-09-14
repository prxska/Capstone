import React, { useMemo, useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, TextInput, 
  ScrollView, Modal, Switch, Platform
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const initialForm = {
  patient: 'Ana López',
  medication: 'Ibuprofeno',
  dose: '400 mg',
  frequency: 'Cada 8 horas',
  startDate: '2026-08-15',
  startTime: '08:00',
  duration: '7 días',
  notes: 'Tomar con agua y alimentos.',
};

const seedEvents = [
  { id: 1, title: 'Ibuprofeno', patient: 'Ana López', date: '2026-08-02', time: '08:00', color: '#89CFF0', frequency: 'Cada 8 horas' },
  { id: 2, title: 'Vitamina D', patient: 'Ana López', date: '2026-08-03', time: '09:00', color: '#B9F2C9', frequency: 'Diario' },
  { id: 3, title: 'Amoxicilina', patient: 'Ana López', date: '2026-08-05', time: '20:00', color: '#FFB3B3', frequency: 'Cada 12 horas' },
  { id: 4, title: 'Omeprazol', patient: 'Ana López', date: '2026-08-07', time: '07:30', color: '#D8BFD8', frequency: 'Cada 24 horas' },
  { id: 5, title: 'Paracetamol', patient: 'Ana López', date: '2026-08-12', time: '15:00', color: '#FFDAB9', frequency: 'Cada 6 horas' },
];

// 1. Se define que el parámetro 'date' es de tipo Date
function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 2. Se define que 'year' y 'month' son de tipo number
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

const initialUser = {
  name: 'Ana López',
  email: 'ana.lopez@email.com',
  password: '********',
};

const initialAlarmSettings = {
  enabled: true,
  leadTime: '15 min antes',
  repeat: 'Cada 10 min',
  sound: 'Sonido suave',
  vibrate: true,
};

export default function App() {
  const [formData, setFormData] = useState(initialForm);
  const [events, setEvents] = useState(seedEvents);
  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 7, 1));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [authMode, setAuthMode] = useState('account');
  const [user, setUser] = useState(initialUser);
  const [alarmSettings, setAlarmSettings] = useState(initialAlarmSettings);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const monthLabel = `${monthNames[selectedMonth.getMonth()]} De ${selectedMonth.getFullYear()}`;

  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth.getFullYear(), selectedMonth.getMonth()),
    [selectedMonth],
  );

  const upcomingEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00`);
    const dateB = new Date(`${b.date}T${b.time}:00`);
    // 3. Se añade .getTime() para que TypeScript permita la resta matemática
    return dateA.getTime() - dateB.getTime();
  });

  // 4. Se define que 'name' y 'value' son de tipo string
  const handleFormChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountChange = (name: string, value: string) => {
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (name: string, value: string) => {
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const newEvent = {
      id: Date.now(),
      title: formData.medication,
      patient: formData.patient,
      date: formData.startDate,
      time: formData.startTime,
      color: '#89CFF0',
      frequency: formData.frequency,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setFormData({ ...initialForm, patient: formData.patient });
    setIsFormOpen(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setAuthMode('account');
    setUser((prev) => ({ ...prev, email: loginForm.email || prev.email }));
    setLoginForm({ email: '', password: '' });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode('login');
    setLoginForm({ email: '', password: '' });
  };

  // 5. Se define que 'direction' es de tipo number
  const changeMonth = (direction: number) => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPanel}>
        <View style={styles.brandWrap}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
          <View>
            <Text style={styles.eyebrow}>DASHBOARD</Text>
            <Text style={styles.title}>Meditrack</Text>
          </View>
        </View>

        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => { setAuthMode('recipe'); setIsFormOpen(true); }}>
            <Text style={styles.primaryButtonText}>+ Receta</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.ghostButton} 
            onPress={() => { setAuthMode(isLoggedIn ? 'account' : 'login'); setIsFormOpen(true); }}
          >
            <Text style={styles.ghostButtonText}>{isLoggedIn ? 'Cuenta' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainLayout} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarPanel}>
          <View style={styles.calendarNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => changeMonth(-1)}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity style={styles.navButton} onPress={() => changeMonth(1)}><Text style={styles.navButtonText}>›</Text></TouchableOpacity>
          </View>
          
          <View style={styles.calendarActions}>
            <TouchableOpacity style={styles.tabButton}><Text style={styles.tabText}>Mes</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tabButton}><Text style={styles.tabText}>Semana</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tabButton} onPress={() => setSelectedMonth(new Date())}><Text style={styles.tabText}>Hoy</Text></TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekdayCell}><Text style={styles.weekdayText}>{day}</Text></View>
            ))}

            {calendarDays.map((date) => {
              const dateKey = formatDateKey(date);
              const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();
              const dayEvents = events.filter((event) => event.date === dateKey);

              return (
                <View key={dateKey} style={[styles.dayCell, !isCurrentMonth && styles.mutedDay]}>
                  <Text style={styles.dayNumber}>{date.getDate()}</Text>
                  {dayEvents.slice(0, 2).map((event) => (
                    <View key={event.id} style={[styles.eventPill, { backgroundColor: event.color }]}>
                      <Text style={styles.eventPillText} numberOfLines={1}>{event.title}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.agendaPanel}>
          <View style={styles.sectionHeader}>
            <View style={[styles.dot, { backgroundColor: '#8A2BE2' }]} />
            <Text style={styles.sectionTitle}>Próximas dosis</Text>
          </View>
          {upcomingEvents.slice(0, 3).map((event) => (
            <View key={event.id} style={styles.agendaItem}>
              <View style={[styles.agendaBullet, { backgroundColor: event.color }]} />
              <View style={styles.agendaInfo}>
                <Text style={styles.agendaTitle}>{event.title}</Text>
                <Text style={styles.agendaTime}>{event.time}</Text>
                <Text style={styles.agendaDate}>{event.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={isFormOpen} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {authMode === 'login' ? 'Iniciar sesión' : authMode === 'account' ? 'Mi cuenta' : 'Nueva receta'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {authMode === 'login' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Correo electrónico</Text>
                  <TextInput style={styles.input} value={loginForm.email} onChangeText={(t) => handleLoginChange('email', t)} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" />
                  <Text style={styles.label}>Contraseña</Text>
                  <TextInput style={styles.input} value={loginForm.password} onChangeText={(t) => handleLoginChange('password', t)} placeholder="********" secureTextEntry />
                  <TouchableOpacity style={styles.submitButton} onPress={handleLogin}><Text style={styles.submitButtonText}>Entrar</Text></TouchableOpacity>
                </View>
              )}

              {authMode === 'account' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput style={styles.input} value={user.name} onChangeText={(t) => handleAccountChange('name', t)} />
                  <Text style={styles.label}>Correo electrónico</Text>
                  <TextInput style={styles.input} value={user.email} onChangeText={(t) => handleAccountChange('email', t)} />
                  
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Vibrar alarmas</Text>
                    <Switch value={alarmSettings.vibrate} onValueChange={(val) => setAlarmSettings(prev => ({...prev, vibrate: val}))} />
                  </View>

                  <TouchableOpacity style={styles.submitButton} onPress={() => setIsFormOpen(false)}><Text style={styles.submitButtonText}>Guardar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.ghostButton, {marginTop: 10}]} onPress={handleLogout}><Text style={styles.ghostButtonText}>Cerrar sesión</Text></TouchableOpacity>
                </View>
              )}

              {authMode === 'recipe' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Paciente</Text>
                  <TextInput style={styles.input} value={formData.patient} onChangeText={(t) => handleFormChange('patient', t)} />
                  
                  <Text style={styles.label}>Medicamento</Text>
                  <TextInput style={styles.input} value={formData.medication} onChangeText={(t) => handleFormChange('medication', t)} />
                  
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Text style={styles.label}>Dosis</Text>
                      <TextInput style={styles.input} value={formData.dose} onChangeText={(t) => handleFormChange('dose', t)} />
                    </View>
                    <View style={styles.halfWidth}>
                      <Text style={styles.label}>Hora</Text>
                      <TextInput style={styles.input} value={formData.startTime} onChangeText={(t) => handleFormChange('startTime', t)} />
                    </View>
                  </View>

                  <Text style={styles.label}>Notas</Text>
                  <TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={(t) => handleFormChange('notes', t)} multiline numberOfLines={3} />

                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}><Text style={styles.submitButtonText}>Guardar receta</Text></TouchableOpacity>
                </View>
              )}
            </ScrollView>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF6F6' },
  headerPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, margin: 15, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } }) },
  brandWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  brandMark: { backgroundColor: '#36B9CC', width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  brandMarkText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  eyebrow: { fontSize: 12, color: '#6B8E9B', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#102A43' },
  topbarActions: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryButton: { backgroundColor: '#36B9CC', paddingVertical: 12, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  ghostButton: { backgroundColor: '#F0F4F8', paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  ghostButtonText: { color: '#102A43', fontWeight: 'bold', fontSize: 16 },
  mainLayout: { flex: 1, paddingHorizontal: 15 },
  calendarPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15 },
  calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  navButton: { backgroundColor: '#EAF6F6', width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center' },
  navButtonText: { fontSize: 20, color: '#36B9CC' },
  monthLabel: { fontSize: 18, fontWeight: 'bold', color: '#102A43' },
  calendarActions: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  tabButton: { backgroundColor: '#EAF6F6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5 },
  tabText: { color: '#36B9CC', fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekdayCell: { width: '14.28%', alignItems: 'center', marginBottom: 10 },
  weekdayText: { color: '#6B8E9B', fontSize: 12, fontWeight: 'bold' },
  dayCell: { width: '14.28%', height: 60, padding: 2, borderTopWidth: 1, borderColor: '#F0F4F8' },
  mutedDay: { opacity: 0.3 },
  dayNumber: { fontSize: 14, color: '#102A43', marginBottom: 2 },
  eventPill: { borderRadius: 4, paddingHorizontal: 2, paddingVertical: 1, marginBottom: 2 },
  eventPillText: { fontSize: 8, color: '#102A43' },
  agendaPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#102A43' },
  agendaItem: { backgroundColor: '#F9FBFC', flexDirection: 'row', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  agendaBullet: { width: 15, height: 15, borderRadius: 7.5, marginRight: 15 },
  agendaInfo: { flex: 1 },
  agendaTitle: { fontSize: 16, fontWeight: 'bold', color: '#102A43' },
  agendaTime: { fontSize: 14, color: '#6B8E9B', marginTop: 2 },
  agendaDate: { fontSize: 12, color: '#9FB3C0', marginTop: 5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalPanel: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#102A43' },
  closeButton: { fontSize: 30, color: '#6B8E9B' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#102A43', marginBottom: 5 },
  input: { backgroundColor: '#F0F4F8', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  submitButton: { backgroundColor: '#36B9CC', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});