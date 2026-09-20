import React, { createContext, useContext, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Modal, Platform, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActiveAlarmData {
  id: string;
  medication: string;
  dose: string;
  color: string;
  colorName: string;
  time: string;
}

interface AlarmContextType {
  triggerManualAlarm: (data: ActiveAlarmData) => void;
}

const AlarmContext = createContext<AlarmContextType>({
  triggerManualAlarm: () => {},
});

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmData | null>(null);

  function startAlarmEffects() {
    try {
      // Patrón de vibración continuo: espera 0ms, vibra 600ms, pausa 400ms...
      Vibration.vibrate([0, 600, 400, 600, 400, 600], true);
    } catch (e) {
      console.warn('Vibración no soportada en este entorno:', e);
    }
  }

  function stopAlarmEffects() {
    try {
      Vibration.cancel();
    } catch (e) {
      console.warn('Error cancelando vibración:', e);
    }
  }

  const triggerManualAlarm = (data: ActiveAlarmData) => {
    setActiveAlarm(data);
    startAlarmEffects();
  };

  const handleConfirmDose = () => {
    stopAlarmEffects();
    setActiveAlarm(null);
  };

  const handleSnooze = () => {
    stopAlarmEffects();
    const current = activeAlarm;
    setActiveAlarm(null);

    // Posponer: vuelve a detonar tras 10 minutos
    setTimeout(() => {
      if (current) {
        triggerManualAlarm(current);
      }
    }, 10 * 60 * 1000);
  };

  return (
    <AlarmContext.Provider value={{ triggerManualAlarm }}>
      {children}

      <Modal
        visible={activeAlarm !== null}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={[styles.headerBanner, { backgroundColor: activeAlarm?.color || '#0284C7' }]}>
              <Ionicons name="alarm" size={54} color="#FFF" />
              <Text style={styles.bannerTitle}>¡HORA DE TU MEDICAMENTO!</Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.medName}>{activeAlarm?.medication}</Text>

              <View style={styles.pillBadge}>
                <Ionicons name="medical" size={20} color="#0284C7" />
                <Text style={styles.pillText}>Dosis: {activeAlarm?.dose}</Text>
              </View>

              {activeAlarm?.colorName ? (
                <Text style={styles.colorHint}>
                  Identificador visual: <Text style={{ fontWeight: 'bold' }}>{activeAlarm.colorName}</Text>
                </Text>
              ) : null}

              <Text style={styles.timeTag}>Horario programado: {activeAlarm?.time}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmDose}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={26} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmButtonText}>Marcar como tomada</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={handleSnooze}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={22} color="#475569" style={{ marginRight: 8 }} />
                  <Text style={styles.snoozeButtonText}>Posponer 10 minutos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </AlarmContext.Provider>
  );
};

export const useAlarm = () => useContext(AlarmContext);
export default AlarmProvider;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  headerBanner: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  body: {
    padding: 24,
    alignItems: 'center',
  },
  medName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369A1',
  },
  colorHint: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  timeTag: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 24,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  snoozeButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
});
