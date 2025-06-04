// app/registro.js
import React, { useState, useEffect } from 'react';
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
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

import { getAuth } from 'firebase/auth';
import { db, app as firebaseApp } from '../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

import { useAuth } from './_layout';

// Definiciones de Tema
const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  textPrimary: '#2D3436',
  textSecondary: '#6c757d',
  backgroundLight: '#FAF7F2',
  errorRed: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  greyMedium: '#ADB5BD',
  offWhite: '#F8F9FA',
  dark: '#2D3436',
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

export default function RegistroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshUserData } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  
  const [formData, setFormData] = useState({
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    aceptaTerminos: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Pre-rellenar campos si vienen del presupuesto
  useEffect(() => {
    console.log("[RegistroScreen] Parámetros recibidos:", params);
    if (params.fromPresupuesto === 'true' && params.ownerData) {
      try {
        let ownerData = {};
        try {
          ownerData = JSON.parse(params.ownerData);
        } catch (error) {
          console.error("[RegistroScreen] Error al parsear ownerData:", error);
          Alert.alert('Error', 'No se pudieron cargar los datos del presupuesto. Por favor, revisa tu conexión o vuelve a intentarlo.');
        }
        setFormData(prev => ({
          ...prev,
          nombre: ownerData?.nombre || '',
          primerApellido: ownerData?.primerApellido || '',
          segundoApellido: ownerData?.segundoApellido || '',
          email: ownerData?.email || '',
          telefono: ownerData?.telefono || ''
        }));
      } catch (error) {
        console.error("[RegistroScreen] Error inesperado en pre-relleno:", error);
        Alert.alert('Error', 'No se pudieron cargar los datos del presupuesto.');
      }
    }
  }, [params]);

  const isValidEmail = (emailToTest) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToTest);

  const validateForm = () => {
    console.log("[validateForm] Iniciando validación con datos:", formData);
    let isValid = true;
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
      isValid = false;
    }
    if (!formData.primerApellido.trim()) {
      newErrors.primerApellido = 'El primer apellido es obligatorio.';
      isValid = false;
    }
    if (!formData.segundoApellido.trim()) {
      newErrors.segundoApellido = 'El segundo apellido es obligatorio.';
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Por favor, ingrese un correo electrónico válido.';
      isValid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria.';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
      isValid = false;
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmar la contraseña es obligatorio.';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
      isValid = false;
    }
    if (!formData.aceptaTerminos) {
      newErrors.aceptaTerminos = 'Debes aceptar los términos y condiciones.';
      isValid = false;
    }
    
    setErrors(newErrors);
    console.log("[validateForm] Resultado:", isValid ? "VÁLIDO" : "INVÁLIDO");
    return isValid;
  };

  const handleRegister = async () => {
    console.log("[handleRegister] Iniciando registro...");
    console.log("[handleRegister] Datos del formulario:", formData);
    
    if (!validateForm()) {
      console.log("[handleRegister] Validación fallida.");
      return;
    }
    
    setIsLoading(true);

    try {
      console.log("[handleRegister] Creando usuario en Firebase Auth...");
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      console.log("[handleRegister] Usuario creado en Auth:", user.uid);

      // Actualizar el perfil del usuario con el nombre completo
      const nombreCompleto = `${formData.nombre} ${formData.primerApellido} ${formData.segundoApellido}`.trim();
      console.log("[handleRegister] Actualizando displayName:", nombreCompleto);
      await updateProfile(user, {
        displayName: nombreCompleto
      });

      // Esperar un momento para asegurar que el usuario esté completamente autenticado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Guardar datos adicionales en Firestore
      console.log("[handleRegister] Guardando datos en Firestore...");
      const userDocData = {
        uid: user.uid,
        nombre: formData.nombre,
        primerApellido: formData.primerApellido,
        segundoApellido: formData.segundoApellido,
        nombreCompleto: nombreCompleto,
        email: formData.email,
        telefono: formData.telefono,
        fechaRegistro: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      };
      
      console.log("[handleRegister] Datos a guardar:", userDocData);
      await setDoc(doc(db, "usuarios", user.uid), userDocData);
      console.log("[handleRegister] Datos guardados en Firestore exitosamente");

      // Refrescar los datos del usuario en el contexto
      if (refreshUserData) {
        console.log("[handleRegister] Refrescando datos del usuario...");
        await refreshUserData(user);
      }
      
      // Pequeño delay para asegurar que los datos se actualicen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Si viene del presupuesto, redirigir a datosCompletos con los datos
      if (params.fromPresupuesto === 'true') {
        try {
          console.log("[handleRegister] Redirigiendo a datosCompletos...");
          const datosCompletosParams = {
            animals: params.animals || JSON.stringify([]),
            ownerData: JSON.stringify({
              nombre: formData.nombre,
              primerApellido: formData.primerApellido,
              segundoApellido: formData.segundoApellido,
              email: formData.email,
              telefono: formData.telefono
            }),
            howHeard: params.howHeard || "",
            selectedPlanId: params.selectedPlanId || "",
            planNombre: params.planNombre || "",
            precioEstimado: params.precioEstimado || "",
            numeroMascotas: params.numeroMascotas || "0",
            fromRegistro: 'true'
          };
          
          console.log("[handleRegister] Parámetros para datosCompletos (ANTES DE REDIRIGIR):", datosCompletosParams);
          if (Platform.OS === 'web') {
            // En web, navega directamente
            router.replace({ pathname: '/datosCompletos', params: datosCompletosParams });
          } else {
            // En móvil, muestra Alert y navega en el callback
            Alert.alert(
              'Registro completado',
              'Tu cuenta se ha creado correctamente. Ahora te llevamos a completar tus datos para el seguro.',
              [
                {
                  text: 'Continuar',
                  onPress: () => {
                    try {
                      router.replace({ pathname: '/datosCompletos', params: datosCompletosParams });
                    } catch (redirError) {
                      console.error("[handleRegister] Error al redirigir a datosCompletos:", redirError);
                      Alert.alert('Error', 'No se pudo redirigir a la pantalla de datos completos. Por favor, accede desde el menú principal.');
                    }
                  }
                }
              ]
            );
          }
        } catch (redirError) {
          console.error("[handleRegister] Error al redirigir a datosCompletos:", redirError);
          Alert.alert('Error', 'No se pudo redirigir a la pantalla de datos completos. Por favor, accede desde el menú principal.');
        }
      } else {
        console.log("[handleRegister] Redirigiendo a home...");
        router.replace('/');
      }
    } catch (error) {
      setIsLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Correo ya registrado',
          'El correo electrónico ya está registrado. Serás redirigido a la pantalla de inicio de sesión.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login');
              }
            }
          ]
        );
        setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado. Inicia sesión.' }));
        return;
      }
      console.error("[handleRegister] Error en el registro:", error);
      Alert.alert('Error', error.message || 'Error al registrar usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const isFromPresupuesto = params.fromPresupuesto === 'true';

  const headerProps = {
    title: "Registro",
    onNavigateToHome: () => router.replace('/'),
    onNavigateToLogin: () => router.push('/login'),
    onNavigateToSignup: null,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundLight }}>
      <Header {...headerProps} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <LinearGradient colors={[theme.backgroundLight, theme.greyLight]} style={styles.gradientContainer}>
          <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.formWrapper}>
              <View>
                <Text style={styles.pageTitle}>Crear Nueva Cuenta</Text>
                <Text style={styles.formTitle}>Regístrate</Text>
                <Text style={styles.formSubtitle}>Crea una cuenta para acceder a todos nuestros servicios.</Text>
              </View>

              <View style={styles.inputsGrid}>
                <View style={[styles.inputRow, isMobile && { flexDirection: 'column', gap: 0 }]}>
                  <View style={[styles.inputGroup, isMobile ? { width: '100%' } : styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Nombre</Text>
                    <View style={[
                      styles.inputContainerView, 
                      errors.nombre ? styles.inputErrorBorder : null, 
                      isFromPresupuesto ? styles.disabledInputContainer : null,
                      focusedField === 'nombre' ? styles.inputContainerViewFocused : null
                    ]}>
                      <MaterialIcons name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, isFromPresupuesto ? styles.disabledInput : null]}
                        placeholder="Nombre"
                        value={formData.nombre}
                        onChangeText={(text) => handleInputChange('nombre', text)}
                        autoCapitalize="words"
                        textContentType="givenName"
                        editable={!isFromPresupuesto}
                        onFocus={() => handleFocus('nombre')}
                        onBlur={handleBlur}
                      />
                    </View>
                    {errors.nombre ? <Text style={styles.errorTextFeedback}>{errors.nombre}</Text> : null}
                  </View>

                  <View style={[styles.inputGroup, isMobile ? { width: '100%' } : styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Primer Apellido</Text>
                    <View style={[
                      styles.inputContainerView, 
                      errors.primerApellido ? styles.inputErrorBorder : null, 
                      isFromPresupuesto ? styles.disabledInputContainer : null,
                      focusedField === 'primerApellido' ? styles.inputContainerViewFocused : null
                    ]}>
                      <MaterialIcons name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, isFromPresupuesto ? styles.disabledInput : null]}
                        placeholder="Primer Apellido"
                        value={formData.primerApellido}
                        onChangeText={(text) => handleInputChange('primerApellido', text)}
                        autoCapitalize="words"
                        textContentType="familyName"
                        editable={!isFromPresupuesto}
                        onFocus={() => handleFocus('primerApellido')}
                        onBlur={handleBlur}
                      />
                    </View>
                    {errors.primerApellido ? <Text style={styles.errorTextFeedback}>{errors.primerApellido}</Text> : null}
                  </View>
                </View>

                <View style={[styles.inputRow, isMobile && { flexDirection: 'column', gap: 0 }]}>
                  <View style={[styles.inputGroup, isMobile ? { width: '100%' } : styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Segundo Apellido</Text>
                    <View style={[
                      styles.inputContainerView, 
                      errors.segundoApellido ? styles.inputErrorBorder : null, 
                      isFromPresupuesto ? styles.disabledInputContainer : null,
                      focusedField === 'segundoApellido' ? styles.inputContainerViewFocused : null
                    ]}>
                      <MaterialIcons name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, isFromPresupuesto ? styles.disabledInput : null]}
                        placeholder="Segundo Apellido"
                        value={formData.segundoApellido}
                        onChangeText={(text) => handleInputChange('segundoApellido', text)}
                        autoCapitalize="words"
                        textContentType="familyName"
                        editable={!isFromPresupuesto}
                        onFocus={() => handleFocus('segundoApellido')}
                        onBlur={handleBlur}
                      />
                    </View>
                    {errors.segundoApellido ? <Text style={styles.errorTextFeedback}>{errors.segundoApellido}</Text> : null}
                  </View>

                  <View style={[styles.inputGroup, isMobile ? { width: '100%' } : styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Teléfono</Text>
                    <View style={[
                      styles.inputContainerView, 
                      errors.telefono ? styles.inputErrorBorder : null, 
                      isFromPresupuesto ? styles.disabledInputContainer : null,
                      focusedField === 'telefono' ? styles.inputContainerViewFocused : null
                    ]}>
                      <MaterialIcons name="phone" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, isFromPresupuesto ? styles.disabledInput : null]}
                        placeholder="Teléfono"
                        value={formData.telefono}
                        onChangeText={(text) => handleInputChange('telefono', text)}
                        keyboardType="phone-pad"
                        textContentType="telephoneNumber"
                        editable={!isFromPresupuesto}
                        onFocus={() => handleFocus('telefono')}
                        onBlur={handleBlur}
                      />
                    </View>
                    {errors.telefono ? <Text style={styles.errorTextFeedback}>{errors.telefono}</Text> : null}
                  </View>
                </View>

                <View style={[styles.inputRow, isMobile && { flexDirection: 'column', gap: 0 }]}>
                  <View style={[styles.inputGroup, isMobile ? { width: '100%' } : styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Contraseña</Text>
                    <View style={[
                      styles.inputContainerView, 
                      errors.password ? styles.inputErrorBorder : null,
                      focusedField === 'password' ? styles.inputContainerViewFocused : null
                    ]}>
                      <MaterialIcons name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={formData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        secureTextEntry
                        textContentType="newPassword"
                        onFocus={() => handleFocus('password')}
                        onBlur={handleBlur}
                      />
                    </View>
                    {errors.password ? <Text style={styles.errorTextFeedback}>{errors.password}</Text> : null}
                  </View>

                  <View style={[styles.inputGroup, isMobile ? { width: '100%' } : styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
                    <View style={[
                      styles.inputContainerView, 
                      errors.confirmPassword ? styles.inputErrorBorder : null,
                      focusedField === 'confirmPassword' ? styles.inputContainerViewFocused : null
                    ]}>
                      <MaterialIcons name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirmar contraseña"
                        value={formData.confirmPassword}
                        onChangeText={(text) => handleInputChange('confirmPassword', text)}
                        secureTextEntry
                        textContentType="newPassword"
                        onFocus={() => handleFocus('confirmPassword')}
                        onBlur={handleBlur}
                      />
                    </View>
                    {errors.confirmPassword ? <Text style={styles.errorTextFeedback}>{errors.confirmPassword}</Text> : null}
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.inputContainerView, 
                  errors.email ? styles.inputErrorBorder : null, 
                  isFromPresupuesto ? styles.disabledInputContainer : null,
                  focusedField === 'email' ? styles.inputContainerViewFocused : null
                ]}>
                  <MaterialIcons name="email" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, isFromPresupuesto ? styles.disabledInput : null]}
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    editable={!isFromPresupuesto}
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                  />
                </View>
                {errors.email ? <Text style={styles.errorTextFeedback}>{errors.email}</Text> : null}
              </View>

              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkboxContainer} 
                  onPress={() => handleInputChange('aceptaTerminos', !formData.aceptaTerminos)}
                >
                  <View style={[styles.checkbox, formData.aceptaTerminos && styles.checkboxChecked]}>
                    {formData.aceptaTerminos && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={styles.termsText}>Acepto los términos y condiciones</Text>
                </TouchableOpacity>
                {errors.aceptaTerminos && (
                  <Text style={styles.errorText}>{errors.aceptaTerminos}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                    <MaterialIcons name="person-add" size={22} color={theme.white} style={{ marginLeft: spacing.small }} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.footerLinksContainer}>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.footerLink}>
                    ¿Ya tienes cuenta? <Text style={styles.footerLinkBold}>Inicia Sesión</Text>
                  </Text>
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
  gradientContainer: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.large },
  formWrapper: { 
    width: '100%', 
    maxWidth: Platform.OS === 'web' ? 800 : 380, 
    backgroundColor: theme.white, 
    borderRadius: theme.borderRadius, 
    padding: Platform.OS === 'web' ? spacing.extraLarge : spacing.large, 
    ...theme.shadow,
    minWidth: 0,
  },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: theme.primaryColor, marginBottom: spacing.medium, textAlign: 'center' },
  formTitle: { ...typography.heading2, color: theme.secondaryColor, marginBottom: spacing.small, textAlign: 'center' },
  formSubtitle: { ...typography.body, color: theme.textSecondary, textAlign: 'center', marginBottom: spacing.large + spacing.medium, fontSize: 15 },
  inputsGrid: {
    width: '100%',
    marginBottom: spacing.medium,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.medium,
    marginBottom: spacing.medium,
  },
  inputGroup: {
    marginBottom: spacing.medium,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: { fontSize: 14, color: theme.secondaryColor, fontWeight: '500', marginBottom: spacing.small / 2 },
  inputContainerView: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.offWhite, 
    borderRadius: theme.borderRadius / 1.5, 
    borderWidth: 1, 
    borderColor: theme.greyLight, 
    paddingHorizontal: spacing.medium,
    outlineStyle: 'none'
  },
  inputContainerViewFocused: {
    borderColor: theme.primaryColor,
    borderWidth: 2,
    outlineStyle: 'none'
  },
  inputIcon: { marginRight: spacing.medium },
  input: { 
    flex: 1, 
    paddingVertical: Platform.OS === 'ios' ? spacing.medium : spacing.medium - 2, 
    fontSize: 16, 
    color: theme.textPrimary,
    outlineStyle: 'none'
  },
  inputErrorBorder: { borderColor: theme.errorRed, borderWidth: 1.5 },
  errorTextFeedback: { color: theme.errorRed, fontSize: 13, marginTop: spacing.small / 2, marginLeft: spacing.small },
  disabledInputContainer: { backgroundColor: '#f5f5f5', borderColor: '#ddd', opacity: 0.8 },
  disabledInput: { color: '#666', backgroundColor: 'transparent' },
  registerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primaryColor, paddingVertical: spacing.medium + 2, borderRadius: theme.borderRadius / 1.5, marginTop: spacing.medium, ...theme.shadow },
  buttonDisabled: { backgroundColor: theme.greyMedium, shadowOpacity: 0.1 },
  registerButtonText: { ...typography.button, color: theme.white, fontSize: 17 },
  footerLinksContainer: { marginTop: spacing.extraLarge, alignItems: 'center' },
  footerLink: { color: theme.textSecondary, fontSize: 14, textAlign: 'center' },
  footerLinkBold: { fontWeight: 'bold', color: theme.primaryColor },
  termsContainer: { marginTop: spacing.medium, alignItems: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: theme.textSecondary, borderRadius: 4, marginRight: spacing.small },
  checkboxChecked: { backgroundColor: theme.primaryColor },
  termsText: { color: theme.textSecondary, fontSize: 14 },
  errorText: { color: theme.errorRed, fontSize: 13, marginTop: spacing.small }
});
