// app/login.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView 
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { getAuth } from 'firebase/auth'; // Importar getAuth
import { app as firebaseApp } from '../firebase/firebaseConfig'; // Importar firebaseApp

import Header from '../components/Header'; 

// Definiciones de Tema (consistente)
const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  textPrimary: '#2D3436',
  textSecondary: '#6c757d',
  backgroundLight: '#FAF7F2', 
  errorRed: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  borderRadius: 12,
  shadow: Platform.select({
    ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 5 },
    android: { elevation: 4 },
    web: { boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }
  }),
};
const typography = { 
  heading2: { fontSize: Platform.OS === 'web' ? 28 : 24, fontWeight: 'bold', color: theme.secondaryColor, textAlign: 'center' },
  body: { fontSize: 16, color: theme.dark, lineHeight: 24 },
  button: { fontSize: 16, fontWeight: '600', color: theme.white, textAlign: 'center' },
};
const spacing = { small: 8, medium: 14, large: 20, extraLarge: 28 };

// Componente FormInput
const FormInput = ({ label, icon, value, onChangeText, placeholder, keyboardType, secureTextEntry, errorText, onBlur, autoCapitalize, textContentType }) => (
  <View style={styles.inputGroup}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={[styles.inputContainerView, errorText ? styles.inputErrorBorder : null]}>
      {icon && <MaterialIcons name={icon} size={20} color={theme.textSecondary} style={styles.inputIcon} />}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || "none"}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        textContentType={textContentType}
      />
    </View>
    {errorText ? <Text style={styles.errorTextFeedback}>{errorText}</Text> : null}
  </View>
);


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(''); // Para errores inline
  const [passwordError, setPasswordError] = useState(''); // Para errores inline
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (emailToTest) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToTest);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) { setEmailError('El correo es obligatorio.'); isValid = false; }
    else if (!isValidEmail(email)) { setEmailError('Email inválido.'); isValid = false; }
    if (!password.trim()) { setPasswordError('La contraseña es obligatoria.'); isValid = false; }
    return isValid;
  }

  const handleLogin = async () => {
    console.log("[LoginScreen] Iniciando login...");
    if (!validateForm()) {
      console.log("[LoginScreen] Validación fallida.");
      return;
    }
    console.log("[LoginScreen] Validación PASADA.");
    setIsLoading(true);

    try {
      const authInstance = getAuth(firebaseApp); // Obtener auth aquí
      console.log("[LoginScreen] Instancia de Auth obtenida.");

      await signInWithEmailAndPassword(authInstance, email, password);
      console.log("[LoginScreen] Inicio de sesión exitoso para:", email);
      // Idealmente, aquí se actualizaría el estado global de autenticación (AuthProvider)
      // y el Header reaccionaría a ese cambio.
      router.replace('/'); // O a '/HomeScreen' o la pantalla principal post-login
    } catch (error) {
      console.error("[LoginScreen] Error de inicio de sesión:", error.code, error.message);
      let specificErrorMessage = 'Credenciales inválidas o error de conexión.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        specificErrorMessage = 'El correo electrónico o la contraseña son incorrectos.';
        setEmailError(specificErrorMessage); 
        setPasswordError(' '); // Para marcar ambos campos si es un error general
      } else if (error.code === 'auth/invalid-email') {
        specificErrorMessage = 'El formato del correo electrónico no es válido.';
        setEmailError(specificErrorMessage);
      } else if (error.code === 'auth/too-many-requests') {
        specificErrorMessage = 'Demasiados intentos. Intenta más tarde.';
      }
      Alert.alert('Error de Inicio de Sesión', specificErrorMessage);
    } finally {
      setIsLoading(false);
      console.log("[LoginScreen] Proceso de login finalizado.");
    }
  };

  const headerProps = {
    title: "Iniciar Sesión",
    onNavigateToHome: () => router.replace('/'), 
    onNavigateToLogin: null, 
    onNavigateToSignup: () => router.push('/registro'),
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundLight }}>
      <Header {...headerProps} /> 
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} >
        <LinearGradient colors={[theme.backgroundLight, theme.greyLight]} style={styles.gradientContainer} >
          <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" >
            <View style={styles.formWrapper}>
              <Text style={styles.formTitle}>Bienvenido de Nuevo</Text>
              <Text style={styles.formSubtitle}>Inicia sesión para continuar.</Text>
              <FormInput
                icon="email"
                value={email}
                onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(''); }}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={emailError}
                textContentType="emailAddress"
                onBlur={() => { if (email.trim() && !isValidEmail(email) && !emailError) setEmailError('Email inválido.'); }}
              />
              <FormInput
                icon="lock"
                value={password}
                onChangeText={(text) => { setPassword(text); if (passwordError) setPasswordError(''); }}
                placeholder="Contraseña"
                secureTextEntry
                errorText={passwordError}
                textContentType="password"
              />
              <TouchableOpacity style={[styles.loginButton, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8} >
                {isLoading ? ( <ActivityIndicator size="small" color={theme.white} /> ) : ( <> <Text style={styles.loginButtonText}>Ingresar</Text> <MaterialIcons name="arrow-forward" size={22} color={theme.white} style={{marginLeft: spacing.small}} /> </> )}
              </TouchableOpacity>
              <View style={styles.footerLinksContainer}>
                <TouchableOpacity onPress={() => router.push('/registro')}>
                  <Text style={styles.footerLink}> ¿No tienes cuenta? <Text style={styles.footerLinkBold}>Regístrate aquí</Text> </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1, },
  scrollContentContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.large, },
  formWrapper: { width: '100%', maxWidth: Platform.OS === 'web' ? 420 : 380, backgroundColor: theme.white, borderRadius: theme.borderRadius, padding: Platform.OS === 'web' ? spacing.extraLarge : spacing.large, ...theme.shadow, },
  formTitle: { ...typography.heading2, color: theme.secondaryColor, marginBottom: spacing.small, textAlign: 'center', },
  formSubtitle: { ...typography.body, color: theme.textSecondary, textAlign: 'center', marginBottom: spacing.large + spacing.medium, fontSize: 15, },
  inputGroup: { marginBottom: spacing.medium, },
  inputLabel: { fontSize: 14, color: theme.secondaryColor, marginBottom: spacing.small / 2, fontWeight: '500', },
  inputContainerView: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.offWhite, borderRadius: theme.borderRadius / 1.5, borderWidth: 1, borderColor: theme.greyLight, paddingHorizontal: spacing.medium, },
  inputIcon: { marginRight: spacing.medium, },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? spacing.medium : spacing.medium - 2, fontSize: 16, color: theme.textPrimary, },
  inputErrorBorder: { borderColor: theme.errorRed, borderWidth: 1.5, },
  errorTextFeedback: { color: theme.errorRed, fontSize: 13, marginTop: spacing.small / 2, marginLeft: spacing.small, },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primaryColor, paddingVertical: spacing.medium + 2, borderRadius: theme.borderRadius / 1.5, marginTop: spacing.large, ...theme.shadow, shadowColor: theme.primaryColor, shadowOpacity: 0.3, },
  buttonDisabled: { backgroundColor: theme.greyMedium, shadowOpacity: 0.1, },
  loginButtonText: { ...typography.button, color: theme.white, fontSize: 17, },
  footerLinksContainer: { marginTop: spacing.extraLarge, alignItems: 'center', },
  footerLink: { color: theme.textSecondary, fontSize: 14, textAlign: 'center', },
  footerLinkBold: { fontWeight: 'bold', color: theme.primaryColor, }
});
