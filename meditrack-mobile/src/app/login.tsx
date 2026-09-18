import React, { useState } from 'react';
import {
  Alert, StyleSheet, View, TextInput, TouchableOpacity,
  Text, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  function resetForm() {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  }

  function handleSwitchMode() {
    resetForm();
    setIsLogin(!isLogin);
  }

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos incompletos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre completo.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Contraseñas no coinciden', 'Asegúrate de que ambas contraseñas sean idénticas.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) Alert.alert('Error al iniciar sesión', error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        Alert.alert('Error en el registro', error.message);
      } else {
        Alert.alert('¡Cuenta creada!', 'Tu registro fue exitoso. Ya puedes iniciar sesión.');
        setIsLogin(true);
        resetForm();
      }
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Visual */}
          <View style={styles.brandWrap}>
            <View style={[styles.brandMark, !isLogin && styles.brandMarkRegister]}>
              <Ionicons
                name={isLogin ? "medical" : "person-add"}
                size={30}
                color="#FFF"
              />
            </View>

            {!isLogin && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NUEVO PACIENTE</Text>
              </View>
            )}

            <Text style={styles.title}>
              {isLogin ? 'MediTrack' : 'Crear Cuenta'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Ingresa tus credenciales para acceder'
                : 'Completa tus datos para registrar tu historial clínico'}
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formCard}>
            {!isLogin && (
              <>
                <Text style={styles.label}>Nombre completo</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#6B8E9B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    onChangeText={setFullName}
                    value={fullName}
                    placeholder="Ej. Juan Pérez"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B8E9B" style={styles.icon} />
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                placeholder="tu@email.com"
                placeholderTextColor="#A0AEC0"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B8E9B" style={styles.icon} />
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#A0AEC0"
                autoCapitalize="none"
              />
            </View>

            {!isLogin && (
              <>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#6B8E9B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    onChangeText={setConfirmPassword}
                    value={confirmPassword}
                    secureTextEntry
                    placeholder="Repite tu contraseña"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, !isLogin && styles.primaryButtonRegister]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Iniciar Sesión' : 'Registrar Paciente'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleSwitchMode}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.switchTextRegular}>
                {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <Text style={styles.switchTextBold}>
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8'
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 28
  },
  brandMark: {
    backgroundColor: '#0EA5E9',
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 }
    })
  },
  brandMarkRegister: {
    backgroundColor: '#0284C7',
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 }
    })
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    paddingHorizontal: 14
  },
  icon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A'
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 }
    })
  },
  primaryButtonRegister: {
    backgroundColor: '#0284C7',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 6
  },
  switchTextRegular: {
    color: '#64748B',
    fontSize: 14
  },
  switchTextBold: {
    color: '#0284C7',
    fontWeight: '700'
  }
});
