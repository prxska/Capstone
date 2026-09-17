import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      
      <Text style={styles.label}>Correo Electrónico</Text>
      <TextInput style={styles.input} editable={false} value="usuario@ejemplo.com" />

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} placeholder="Ingresa tu nombre..." />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#2c3e50', textAlign: 'center' },
  label: { fontSize: 14, color: '#7f8c8d', marginBottom: 5 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  logoutButton: { backgroundColor: '#e74c3c' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});