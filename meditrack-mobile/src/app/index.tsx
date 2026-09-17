import React, { useMemo, useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, TextInput, 
  ScrollView, Modal, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const initialRecipeForm = {
  patient: 'Ana López',
  medication: 'Ibuprofeno',
  dose: '400 mg',
  frequency: 'Cada 8 horas',
  startDate: '2026-08-15',
  startTime: '08:00',
  notes: 'Tomar con alimentos.',
};

const initialAppointmentForm = {
  patient: 'Ana López',
  doctor: 'Dr. Pérez',
  specialty: 'Cardiología',
  date: '2026-08-18',
  time: '10:00',
  location: 'Clínica Alemana',
};

const seedEvents = [
  { id: 1, title: 'Ibuprofeno', patient: 'Ana López', date: '2026-08-02', time: '08:00', color: '#89CFF0', type: 'recipe' },
  { id: 2, title: 'Vitamina D', patient: 'Ana López', date: '2026-08-03', time: '09:00', color: '#B9F2C9', type: 'recipe' },
  { id: 3, title: 'Control Cardiología', patient: 'Ana López', date: '2026-08-05', time: '10:00', color: '#FFB3B3', type: 'appointment' },
];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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
  const [recipeForm, setRecipeForm] = useState(initialRecipeForm);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [events, setEvents] = useState(seedEvents);
  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 7, 1));
  
  // Estados para controlar el Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'recipe' | 'appointment'>('recipe');

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const monthLabel = `${monthNames[selectedMonth.getMonth()]} De ${selectedMonth.getFullYear()}`;

  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth.getFullYear(), selectedMonth.getMonth()),
    [selectedMonth]
  );

  const upcomingEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00`);
    const dateB = new Date(`${b.date}T${b.time}:00`);
    return dateA.getTime() - dateB.getTime();
  });

  const handleRecipeChange = (name: string, value: string) => {
    setRecipeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentChange = (name: string, value: string) => {
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const newEvent = formType === 'recipe' 
      ? {
          id: Date.now(),
          title: recipeForm.medication,
          patient: recipeForm.patient,
          date: recipeForm.startDate,
          time: recipeForm.startTime,
          color: '#89CFF0',
          type: 'recipe',
        }
      : {
          id: Date.now(),
          title: `Cita: ${appointmentForm.specialty}`,
          patient: appointmentForm.patient,
          date: appointmentForm.date,
          time: appointmentForm.time,
          color: '#FFB3B3',
          type: 'appointment',
        };

    setEvents((prev) => [newEvent, ...prev]);
    setIsFormOpen(false);
    
    if (formType === 'recipe') setRecipeForm(initialRecipeForm);
    else setAppointmentForm(initialAppointmentForm);
  };

  const changeMonth = (direction: number) => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1));
  };

  const openModal = (type: 'recipe' | 'appointment') => {
    setFormType(type);
    setIsFormOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPanel}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandWrap}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
            <View>
              <Text style={styles.eyebrow}>DASHBOARD</Text>
              <Text style={styles.title}>MediTrack</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile' as any)}>
            <Ionicons name="person-circle" size={45} color="#36B9CC" />
          </TouchableOpacity>
        </View>

        {/* --- NUEVA BOTONERA DOBLE --- */}
        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openModal('recipe')}>
            <Text style={styles.primaryButtonText}>+ Receta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={() => openModal('appointment')}>
            <Text style={styles.secondaryButtonText}>+ Cita Médica</Text>
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
            <Text style={styles.sectionTitle}>Próximas atenciones</Text>
          </View>
          {upcomingEvents.slice(0, 3).map((event) => (
            <View key={event.id} style={styles.agendaItem}>
              <View style={[styles.agendaBullet, { backgroundColor: event.color }]} />
              <View style={styles.agendaInfo}>
                <Text style={styles.agendaTitle}>{event.title}</Text>
                <Text style={styles.agendaTime}>{event.time} - {event.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* --- MODAL INTELIGENTE --- */}
      <Modal visible={isFormOpen} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formType === 'recipe' ? 'Nueva Receta' : 'Nueva Cita Médica'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                
                {formType === 'recipe' ? (
                  <>
                    <Text style={styles.label}>Paciente</Text>
                    <TextInput style={styles.input} value={recipeForm.patient} onChangeText={(t) => handleRecipeChange('patient', t)} />
                    <Text style={styles.label}>Medicamento</Text>
                    <TextInput style={styles.input} value={recipeForm.medication} onChangeText={(t) => handleRecipeChange('medication', t)} />
                    
                    <View style={styles.row}>
                      <View style={styles.halfWidth}>
                        <Text style={styles.label}>Dosis</Text>
                        <TextInput style={styles.input} value={recipeForm.dose} onChangeText={(t) => handleRecipeChange('dose', t)} />
                      </View>
                      <View style={styles.halfWidth}>
                        <Text style={styles.label}>Hora de inicio</Text>
                        <TextInput style={styles.input} value={recipeForm.startTime} onChangeText={(t) => handleRecipeChange('startTime', t)} />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Paciente</Text>
                    <TextInput style={styles.input} value={appointmentForm.patient} onChangeText={(t) => handleAppointmentChange('patient', t)} />
                    <Text style={styles.label}>Médico Tratante</Text>
                    <TextInput style={styles.input} value={appointmentForm.doctor} onChangeText={(t) => handleAppointmentChange('doctor', t)} />
                    <Text style={styles.label}>Especialidad o Centro</Text>
                    <TextInput style={styles.input} value={appointmentForm.specialty} onChangeText={(t) => handleAppointmentChange('specialty', t)} />
                    
                    <View style={styles.row}>
                      <View style={styles.halfWidth}>
                        <Text style={styles.label}>Fecha</Text>
                        <TextInput style={styles.input} value={appointmentForm.date} onChangeText={(t) => handleAppointmentChange('date', t)} />
                      </View>
                      <View style={styles.halfWidth}>
                        <Text style={styles.label}>Hora</Text>
                        <TextInput style={styles.input} value={appointmentForm.time} onChangeText={(t) => handleAppointmentChange('time', t)} />
                      </View>
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Guardar</Text>
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
  headerPanel: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, margin: 15, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } }) },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  brandWrap: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { backgroundColor: '#36B9CC', width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  brandMarkText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  eyebrow: { fontSize: 12, color: '#6B8E9B', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#102A43' },
  iconButton: { justifyContent: 'center', alignItems: 'center' },
  topbarActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  primaryButton: { backgroundColor: '#36B9CC', flexDirection: 'row', paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  secondaryButton: { backgroundColor: '#F0F4F8', flexDirection: 'row', paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#36B9CC' },
  secondaryButtonText: { color: '#36B9CC', fontWeight: 'bold', fontSize: 14 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalPanel: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#102A43' },
  closeButton: { fontSize: 30, color: '#6B8E9B' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#102A43', marginBottom: 5 },
  input: { backgroundColor: '#F0F4F8', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  submitButton: { backgroundColor: '#36B9CC', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});