import React, { useState } from 'react';
import { 
  Alert, StyleSheet, View, TextInput, TouchableOpacity, 
  Text, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Alterna entre Login y Registro

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    if (isLogin) {
      // Flujo de Inicio de Sesión
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error al iniciar sesión', error.message);
    } else {
      // Flujo de Registro
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert('Error en el registro', error.message);
      } else {
        // Al tener "Confirm Email" apagado en Supabase, el registro es automático
        Alert.alert('¡Bienvenido!', 'Tu cuenta ha sido creada exitosamente.');
      }
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <View style={styles.brandWrap}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
          <Text style={styles.title}>MediTrack</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta de paciente'}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#6B8E9B" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              onChangeText={setEmail} 
              value={email} 
              placeholder="tu@email.com" 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#6B8E9B" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              onChangeText={setPassword} 
              value={password} 
              secureTextEntry 
              placeholder="********" 
              autoCapitalize="none" 
            />
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAuth} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => setIsLogin(!isLogin)} 
            disabled={loading}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF6F6' },
  content: { flex: 1, justifyContent: 'center', padding: 25 },
  brandWrap: { alignItems: 'center', marginBottom: 40 },
  brandMark: { backgroundColor: '#36B9CC', width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15, ...Platform.select({ ios: { shadowColor: '#36B9CC', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) },
  brandMarkText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#102A43', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#6B8E9B' },
  formGroup: { backgroundColor: '#FFF', padding: 25, borderRadius: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } }) },
  label: { fontSize: 14, fontWeight: '600', color: '#102A43', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 10, marginBottom: 20, paddingHorizontal: 15 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#102A43' },
  primaryButton: { backgroundColor: '#36B9CC', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchButtonText: { color: '#36B9CC', fontSize: 14, fontWeight: '600' }
});