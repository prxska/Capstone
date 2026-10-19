import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  OWNER_PROFILE_ID,
  createCareProfile,
  deleteCareProfile,
  getOwnerName,
  listCareProfiles,
  renameCareProfile,
  setOwnerName,
  type CareProfile,
} from '../lib/careProfiles';

type Props = { onOwnerRenamed?: (name: string) => void };

/** Lista de perfiles de la cuenta: el titular ("Yo") y las personas que cuida. */
export function ProfilesManager({ onOwnerRenamed }: Props) {
  const { isDarkMode, largeFont } = useTheme();
  const [profiles, setProfiles] = useState<CareProfile[]>([]);
  const [ownerName, setOwnerNameState] = useState('');
  const [loading, setLoading] = useState(true);
  // null = cerrado; { id: null } = crear; { id } = renombrar
  const [editing, setEditing] = useState<{ id: string | null; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const [list, owner] = await Promise.all([listCareProfiles(), getOwnerName()]);
    setProfiles(list);
    setOwnerNameState(owner);
    setLoading(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre de la persona.');
      return;
    }
    setSaving(true);
    try {
      if (editing.id === OWNER_PROFILE_ID) {
        await setOwnerName(editing.name);
        onOwnerRenamed?.(editing.name.trim());
      } else if (editing.id) {
        await renameCareProfile(editing.id, editing.name);
      } else {
        await createCareProfile(editing.name);
      }
      setEditing(null);
      await reload();
    } catch (err: any) {
      Alert.alert('No se pudo guardar el perfil', String(err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (profile: CareProfile) => {
    Alert.alert(
      `Eliminar a ${profile.name}`,
      `Se borrarán también todos los medicamentos y citas de ${profile.name}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCareProfile(profile.id);
              await reload();
            } catch (err: any) {
              Alert.alert('No se pudo eliminar el perfil', String(err?.message || ''));
            }
          },
        },
      ]
    );
  };

  const textColor = isDarkMode ? '#F1F5F9' : '#102A43';
  const subColor = isDarkMode ? '#CBD5E1' : '#475569';
  const big = largeFont ? 4 : 0;

  return (
    <View style={[styles.card, isDarkMode && styles.darkCard]}>
      <Text style={[styles.help, { color: subColor, fontSize: 16 + big }]}>
        Agrega a las personas que cuidas, por ejemplo un hijo o tus padres. Cada perfil tiene sus propios
        medicamentos y citas, y sus alertas también suenan en este teléfono.
      </Text>

      <View style={styles.row}>
        <Ionicons name="person" size={24} color="#0284C7" />
        <Text style={[styles.name, { color: textColor, fontSize: 20 + big }]} numberOfLines={1}>
          {ownerName || 'Yo'} <Text style={{ color: subColor, fontWeight: '500' }}>(tú)</Text>
        </Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setEditing({ id: OWNER_PROFILE_ID, name: ownerName })}
          accessibilityLabel="Cambiar tu nombre"
        >
          <Ionicons name="pencil" size={22} color={isDarkMode ? '#7DD3FC' : '#0369A1'} />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#0284C7" style={{ marginVertical: 10 }} /> : null}

      {profiles.map((profile) => (
        <View key={profile.id} style={[styles.row, styles.rowDivider, isDarkMode && { borderColor: '#334155' }]}>
          <Ionicons name="people" size={24} color="#0284C7" />
          <Text style={[styles.name, { color: textColor, fontSize: 20 + big }]} numberOfLines={1}>
            {profile.name}
          </Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setEditing({ id: profile.id, name: profile.name })}
            accessibilityLabel={`Cambiar nombre de ${profile.name}`}
          >
            <Ionicons name="pencil" size={22} color={isDarkMode ? '#7DD3FC' : '#0369A1'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(profile)}
            accessibilityLabel={`Eliminar perfil de ${profile.name}`}
          >
            <Ionicons name="trash" size={22} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setEditing({ id: null, name: '' })}
        accessibilityRole="button"
      >
        <Ionicons name="person-add" size={22} color="#FFF" />
        <Text style={[styles.addButtonText, { fontSize: 18 + big }]}>Agregar perfil</Text>
      </TouchableOpacity>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.dialog, isDarkMode && styles.darkCard]}>
            <Text style={[styles.dialogTitle, { color: textColor, fontSize: 22 + big }]}>
              {editing?.id === OWNER_PROFILE_ID ? 'Tu nombre' : editing?.id ? 'Cambiar nombre' : 'Nuevo perfil'}
            </Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput, { fontSize: 18 + big }]}
              placeholder="Nombre, ej. Tomás"
              placeholderTextColor="#94A3B8"
              value={editing?.name || ''}
              onChangeText={(name) => setEditing((prev) => (prev ? { ...prev, name } : prev))}
              maxLength={60}
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(null)} disabled={saving}>
                <Text style={[styles.cancelText, { color: subColor, fontSize: 18 + big }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.addButtonText, { fontSize: 18 + big }]}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 24 },
  darkCard: { backgroundColor: '#1E293B' },
  help: { lineHeight: 22, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  rowDivider: { borderTopWidth: 1, borderColor: '#E2E8F0' },
  name: { flex: 1, fontWeight: '700' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  addButtonText: { color: '#FFF', fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  dialogTitle: { fontWeight: '800', marginBottom: 14 },
  input: { backgroundColor: '#F0F4F8', borderRadius: 12, padding: 15, color: '#102A43' },
  darkInput: { backgroundColor: '#334155', color: '#F1F5F9' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 14 },
  cancelText: { fontWeight: '700' },
  saveButton: { backgroundColor: '#0284C7', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 14, minWidth: 110, alignItems: 'center' },
});
