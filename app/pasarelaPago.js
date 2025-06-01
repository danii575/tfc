import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../components/Header';
import { FadeInSection } from '../components/FadeInSection';
import { useAuth } from './_layout';
import { doc, updateDoc, collection, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { loadStripe } from '@stripe/stripe-js';

// Clave pública de Stripe (deberías obtenerla de tu cuenta de Stripe)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RSfbRQYSZMbABiaTC68nu8w7OSLhsZtFaurYBKwYIiA8GOawAY9MEoWQ6GOV0hAjuoFjFJI0jyGeNzlJtDiZ5yK00xxTGWwsl';

// --- Definiciones de Tema ---
const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  accentColor: '#E9C46A',
  mutedPrimary: '#A8DADC',
  offWhite: '#FAF7F2',
  success: '#28a745',
  successDarker: '#218838',
  error: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  greyMedium: '#6c757d',
  cardBackground: 'rgba(42,157,143,0.10)',
  inputBackground: '#FFFFFF',
  borderColor: '#E9ECEF',
  borderRadius: 12,
  buttonBorderRadius: 50,
  shadow: Platform.select({
    ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8 },
    android: { elevation: 6 },
    web: { boxShadow: '0 6px 12px rgba(0,0,0,0.1)' },
  }),
};

const spacing = { small: 8, medium: 14, large: 20, extraLarge: 28, ultraLarge: 48 };

// Componente de input animado
const AnimatedInput = ({ style, onFocus, onBlur, error, ...props }) => {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e) => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    onBlur && onBlur(e);
  };

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [error]);

  const animatedStyle = {
    borderColor: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.borderColor, theme.primaryColor],
    }),
    borderWidth: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2],
    }),
    transform: [{
      translateX: errorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 5],
      })
    }],
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      <TextInput
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[props.inputStyle]}
      />
    </Animated.View>
  );
};

// --- Funciones de Validación ---
const validarTarjeta = (numero) => {
  const numeroLimpio = numero.replace(/\s/g, '');
  
  // Validar longitud básica
  if (!/^\d{13,19}$/.test(numeroLimpio)) {
    return { valido: false, mensaje: 'El número de tarjeta debe tener entre 13 y 19 dígitos' };
  }
  
  // Detectar tipo de tarjeta y país
  let tipoTarjeta = 'unknown';
  let paisTarjeta = 'unknown';
  let token = '';
  
  // Detección de marca y país
  if (/^4/.test(numeroLimpio)) {
    tipoTarjeta = 'visa';
    if (numeroLimpio.startsWith('4242')) {
      paisTarjeta = 'us';
      token = 'tok_visa';
    } else if (numeroLimpio.startsWith('4000')) {
      if (numeroLimpio.startsWith('400000')) {
        paisTarjeta = 'es';
        token = 'tok_es';
      } else if (numeroLimpio.startsWith('400001')) {
        paisTarjeta = 'fr';
        token = 'tok_fr';
      } else if (numeroLimpio.startsWith('400002')) {
        paisTarjeta = 'de';
        token = 'tok_de';
      } else if (numeroLimpio.startsWith('400003')) {
        paisTarjeta = 'it';
        token = 'tok_it';
      } else if (numeroLimpio.startsWith('400004')) {
        paisTarjeta = 'gb';
        token = 'tok_gb';
      }
    }
  } else if (/^5[1-5]/.test(numeroLimpio)) {
    tipoTarjeta = 'mastercard';
    token = 'tok_mastercard';
  } else if (/^3[47]/.test(numeroLimpio)) {
    tipoTarjeta = 'amex';
    token = 'tok_amex';
  } else if (/^6/.test(numeroLimpio)) {
    tipoTarjeta = 'discover';
    token = 'tok_discover';
  } else if (/^3[0-9]/.test(numeroLimpio)) {
    tipoTarjeta = 'diners';
    token = 'tok_diners';
  } else if (/^35/.test(numeroLimpio)) {
    tipoTarjeta = 'jcb';
    token = 'tok_jcb';
  } else if (/^62/.test(numeroLimpio)) {
    tipoTarjeta = 'unionpay';
    token = 'tok_unionpay';
  }
  
  // Algoritmo de Luhn
  let suma = 0;
  let alternar = false;
  
  for (let i = numeroLimpio.length - 1; i >= 0; i--) {
    let digito = parseInt(numeroLimpio.charAt(i));
    
    if (alternar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    
    suma += digito;
    alternar = !alternar;
  }
  
  if (suma % 10 !== 0) {
    return { valido: false, mensaje: 'Número de tarjeta inválido' };
  }
  
  return { 
    valido: true, 
    tipo: tipoTarjeta,
    pais: paisTarjeta,
    token: token
  };
};

const validarCVV = (cvv, tipoTarjeta) => {
  if (tipoTarjeta === 'amex') {
    return /^\d{4}$/.test(cvv) ? 
      { valido: true } : 
      { valido: false, mensaje: 'El CVV debe tener 4 dígitos para American Express' };
  }
  return /^\d{3}$/.test(cvv) ? 
    { valido: true } : 
    { valido: false, mensaje: 'El CVV debe tener 3 dígitos' };
};

const validarFechaExpiracion = (mes, año) => {
  const mesNum = parseInt(mes);
  const añoNum = parseInt(año);
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1;
  const añoActual = fechaActual.getFullYear();
  
  if (mesNum < 1 || mesNum > 12) {
    return { valido: false, mensaje: 'Mes inválido' };
  }
  
  if (añoNum < añoActual) {
    return { valido: false, mensaje: 'Año inválido' };
  }
  
  if (añoNum === añoActual && mesNum < mesActual) {
    return { valido: false, mensaje: 'La tarjeta ha expirado' };
  }
  
  return { valido: true };
};

const detectarTipoTarjeta = (numero) => {
  const numeroLimpio = numero.replace(/\s/g, '');
  
  if (/^4/.test(numeroLimpio)) return 'visa';
  if (/^5[1-5]/.test(numeroLimpio)) return 'mastercard';
  if (/^3[47]/.test(numeroLimpio)) return 'amex';
  if (/^6/.test(numeroLimpio)) return 'discover';
  
  return 'unknown';
};

const formatearNumeroTarjeta = (numero) => {
  const numeroLimpio = numero.replace(/\s/g, '');
  const grupos = numeroLimpio.match(/.{1,4}/g);
  return grupos ? grupos.join(' ') : numeroLimpio;
};

export default function PasarelaPago() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [stripe, setStripe] = useState(null);
  
  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [datosFormulario, setDatosFormulario] = useState({
    numeroTarjeta: '',
    nombreTitular: '',
    mesExpiracion: '',
    añoExpiracion: '',
    cvv: '',
    email: '',
    telefono: '',
    aceptaTerminos: false,
    aceptaMarketing: false,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [tipoTarjeta, setTipoTarjeta] = useState('unknown');
  const [mensajeError, setMensajeError] = useState('');
  
  // Referencias para animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Añadir un estado y animación para el perro
  const [dogAnim] = useState(new Animated.Value(0));
  
  // Datos del plan desde parámetros
  const planData = {
    nombre: params.planNombre || 'Plan Básico',
    precio: parseFloat(params.precioTotal) || 29.00,
    seguroCivil: params.seguroCivil === 'true',
    precioCivil: 15.00,
  };

  const precioTotal = planData.precio + (planData.seguroCivil ? planData.precioCivil : 0);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (user) {
        try {
          const userRef = doc(db, "usuarios", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDatosFormulario(prev => ({
              ...prev,
              email: userData.email || user.email || '',
              telefono: userData.telefono || '',
            }));
          }
        } catch (error) {
          console.error("Error cargando datos del usuario:", error);
        }
      }
    };
    
    cargarDatosUsuario();
  }, [user]);

  useEffect(() => {
    const tipo = detectarTipoTarjeta(datosFormulario.numeroTarjeta);
    setTipoTarjeta(tipo);
  }, [datosFormulario.numeroTarjeta]);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso para el botón de pago
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleInputChange = (campo, valor) => {
    let valorProcesado = valor;
    
    switch (campo) {
      case 'numeroTarjeta':
        valorProcesado = formatearNumeroTarjeta(valor);
        setTipoTarjeta(detectarTipoTarjeta(valor));
        break;
      case 'mesExpiracion':
        valorProcesado = valor.replace(/[^0-9]/g, '').slice(0, 2);
        if (parseInt(valorProcesado) > 12) valorProcesado = '12';
        break;
      case 'añoExpiracion':
        valorProcesado = valor.replace(/[^0-9]/g, '').slice(0, 4);
        break;
      case 'cvv':
        valorProcesado = valor.replace(/[^0-9]/g, '').slice(0, tipoTarjeta === 'amex' ? 4 : 3);
        break;
    }
    
    setDatosFormulario(prev => ({
      ...prev,
      [campo]: valorProcesado
    }));
    
    // Limpiar error si existe
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: null
      }));
    }
  };

  // Función para animar errores
  const animateError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (metodoPago === 'tarjeta') {
      const validacionTarjeta = validarTarjeta(datosFormulario.numeroTarjeta);
      if (!validacionTarjeta.valido) {
        nuevosErrores.numeroTarjeta = validacionTarjeta.mensaje;
      } else {
        setTipoTarjeta(validacionTarjeta.tipo);
      }
      
      if (!datosFormulario.nombreTitular.trim()) {
        nuevosErrores.nombreTitular = 'Nombre del titular es obligatorio';
      }
      
      const validacionFecha = validarFechaExpiracion(datosFormulario.mesExpiracion, datosFormulario.añoExpiracion);
      if (!validacionFecha.valido) {
        nuevosErrores.fechaExpiracion = validacionFecha.mensaje;
      }
      
      const validacionCVV = validarCVV(datosFormulario.cvv, tipoTarjeta);
      if (!validacionCVV.valido) {
        nuevosErrores.cvv = validacionCVV.mensaje;
      }
    }

    if (!datosFormulario.email.includes('@')) {
      nuevosErrores.email = 'Email inválido';
    }

    if (!datosFormulario.telefono.trim()) {
      nuevosErrores.telefono = 'Teléfono es obligatorio';
    }

    if (!datosFormulario.aceptaTerminos) {
      nuevosErrores.terminos = 'Debes aceptar los términos y condiciones';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const procesarPago = async () => {
    if (!validarFormulario()) {
      animateError();
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    setIsLoading(true);

    try {
      const numeroTarjeta = datosFormulario.numeroTarjeta.replace(/\s/g, '');
      if (numeroTarjeta === '4242424242424242') {
        setPagoExitoso(true);
        setShowModal(true);
        setMensajeError('');
      } else if (numeroTarjeta === '4000000000000002') {
        setPagoExitoso(false);
        setMensajeError('La tarjeta fue rechazada (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000009995') {
        setPagoExitoso(false);
        setMensajeError('Fondos insuficientes (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000009987') {
        setPagoExitoso(false);
        setMensajeError('Tarjeta extraviada (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000009979') {
        setPagoExitoso(false);
        setMensajeError('Tarjeta robada (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000000069') {
        setPagoExitoso(false);
        setMensajeError('La tarjeta ha expirado (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000000127') {
        setPagoExitoso(false);
        setMensajeError('El código de seguridad (CVC) es incorrecto (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000000119') {
        setPagoExitoso(false);
        setMensajeError('Error de procesamiento de la tarjeta (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000000000006975') {
        setPagoExitoso(false);
        setMensajeError('Límite de velocidad de la tarjeta excedido (prueba Stripe).');
        setShowModal(true);
      } else if (numeroTarjeta === '4000051230000072') {
        setPagoExitoso(true);
        setShowModal(true);
        setMensajeError('');
      } else {
        setPagoExitoso(false);
        setMensajeError('Tarjeta de prueba no válida. Usa una de las tarjetas de prueba de Stripe. Ejemplo: 4242 4242 4242 4242');
        setShowModal(true);
      }
    } catch (error) {
      setPagoExitoso(false);
      setMensajeError(error.message);
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getTarjetaIcon = () => {
    switch (tipoTarjeta) {
      case 'visa':
        return 'credit-card';
      case 'mastercard':
        return 'credit-card';
      case 'amex':
        return 'credit-card';
      case 'discover':
        return 'credit-card';
      default:
        return 'credit-card';
    }
  };

  useEffect(() => {
    // Inicializar Stripe
    const initStripe = async () => {
      const stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
    };
    initStripe();
  }, []);

  useEffect(() => {
    if (showModal) {
      Animated.sequence([
        Animated.timing(dogAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.elastic(1.2)),
          useNativeDriver: false,
        })
      ]).start();
    } else {
      dogAnim.setValue(0);
    }
  }, [showModal]);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { translateX: shakeAnim }
              ]
            }
          ]}
        >
          
          <FadeInSection animationKey="header" style={styles.headerSection}>
            <MaterialCommunityIcons name="credit-card-outline" size={48} color={theme.primaryColor} />
            <Text style={styles.pageTitle}>Finalizar Pago</Text>
            <Text style={styles.pageSubtitle}>
              Completa tu suscripción de forma segura
            </Text>
          </FadeInSection>

          {/* Resumen del Plan */}
          <FadeInSection animationKey="plan-summary">
            <Animated.View 
              style={[
                styles.planSummary,
                Platform.OS === 'web' && {
                  transition: 'all 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  }
                }
              ]}
            >
            <View style={styles.summaryHeader}>
              <MaterialCommunityIcons name="shield-check" size={24} color={theme.primaryColor} />
              <Text style={styles.summaryTitle}>Resumen del Plan</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{planData.nombre}</Text>
                <Text style={styles.summaryPrice}>{planData.precio.toFixed(2)}€/mes</Text>
              </View>
              {planData.seguroCivil && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Seguro Responsabilidad Civil</Text>
                  <Text style={styles.summaryPrice}>{planData.precioCivil.toFixed(2)}€/mes</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total Mensual</Text>
                <Text style={styles.summaryTotalPrice}>{precioTotal.toFixed(2)}€</Text>
              </View>
            </View>
            </Animated.View>
          </FadeInSection>

          {/* Métodos de Pago */}
          <FadeInSection animationKey="payment-methods" style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentMethod, metodoPago === 'tarjeta' && styles.paymentMethodActive]}
                onPress={() => setMetodoPago('tarjeta')}
              >
                <FontAwesome5 name="credit-card" size={24} color={metodoPago === 'tarjeta' ? theme.white : theme.primaryColor} />
                <Text style={[styles.paymentMethodText, metodoPago === 'tarjeta' && styles.paymentMethodTextActive]}>
                  Tarjeta de Crédito/Débito
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.paymentMethod, metodoPago === 'paypal' && styles.paymentMethodActive]}
                onPress={() => setMetodoPago('paypal')}
              >
                <FontAwesome5 name="paypal" size={24} color={metodoPago === 'paypal' ? theme.white : theme.primaryColor} />
                <Text style={[styles.paymentMethodText, metodoPago === 'paypal' && styles.paymentMethodTextActive]}>
                  PayPal
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInSection>

          {/* Formulario de Tarjeta */}
          {metodoPago === 'tarjeta' && (
            <FadeInSection animationKey="card-form" style={styles.cardForm}>
              <Text style={styles.formSectionTitle}>Datos de la Tarjeta</Text>
              
              <View style={styles.cardFormContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre del Titular *</Text>
                  <View style={[styles.inputWrapper, errors.nombreTitular && styles.inputError]}>
                    <MaterialIcons name="person" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={datosFormulario.nombreTitular}
                      onChangeText={(value) => handleInputChange('nombreTitular', value)}
                      placeholder="Como aparece en la tarjeta"
                      placeholderTextColor={theme.greyMedium}
                    />
                  </View>
                  {errors.nombreTitular && <Text style={styles.errorText}>{errors.nombreTitular}</Text>}
                </View>

                <View style={styles.cardRow}>
                  <View style={styles.cardColumn}>
                    <Text style={styles.label}>Número de Tarjeta *</Text>
                    <View style={[styles.cardInput, errors.numeroTarjeta && styles.cardInputError]}>
                      <TextInput
                        style={styles.cardInput}
                        value={datosFormulario.numeroTarjeta}
                        onChangeText={(value) => handleInputChange('numeroTarjeta', value)}
                        placeholder="4242 4242 4242 4242"
                        keyboardType="number-pad"
                        placeholderTextColor={theme.greyMedium}
                      />
                      <MaterialIcons name={getTarjetaIcon()} size={24} color={theme.greyMedium} style={styles.cardIcon} />
                    </View>
                    {errors.numeroTarjeta && <Text style={styles.errorText}>{errors.numeroTarjeta}</Text>}
                  </View>
                  <View style={styles.cardColumnLast}>
                    <Text style={styles.label}>CVV *</Text>
                    <View style={[styles.cardInput, errors.cvv && styles.cardInputError]}>
                      <TextInput
                        style={styles.cardInput}
                        value={datosFormulario.cvv}
                        onChangeText={(value) => handleInputChange('cvv', value)}
                        placeholder="123"
                        keyboardType="number-pad"
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                    {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <View style={styles.cardColumn}>
                    <Text style={styles.label}>Fecha de Expiración *</Text>
                    <View style={[styles.cardInput, errors.mesExpiracion && styles.cardInputError]}>
                      <TextInput
                        style={styles.cardInput}
                        value={datosFormulario.mesExpiracion}
                        onChangeText={(value) => handleInputChange('mesExpiracion', value)}
                        placeholder="MM"
                        keyboardType="number-pad"
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                    {errors.mesExpiracion && <Text style={styles.errorText}>{errors.mesExpiracion}</Text>}
                  </View>
                  <View style={styles.cardColumnLast}>
                    <Text style={styles.label}>Año de Expiración *</Text>
                    <View style={[styles.cardInput, errors.añoExpiracion && styles.cardInputError]}>
                      <TextInput
                        style={styles.cardInput}
                        value={datosFormulario.añoExpiracion}
                        onChangeText={(value) => handleInputChange('añoExpiracion', value)}
                        placeholder="AAAA"
                        keyboardType="number-pad"
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                    {errors.añoExpiracion && <Text style={styles.errorText}>{errors.añoExpiracion}</Text>}
                  </View>
                </View>
              </View>
            </FadeInSection>
          )}

          {/* Información de Contacto */}
          <FadeInSection animationKey="contact-info" style={styles.contactForm}>
            <Text style={styles.formSectionTitle}>Información de Contacto</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <MaterialIcons name="email" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={datosFormulario.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  placeholderTextColor={theme.greyMedium}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono *</Text>
              <View style={[styles.inputWrapper, errors.telefono && styles.inputError]}>
                <MaterialIcons name="phone" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={datosFormulario.telefono}
                  onChangeText={(value) => handleInputChange('telefono', value)}
                  placeholder="+34 123 456 789"
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.greyMedium}
                />
              </View>
              {errors.telefono && <Text style={styles.errorText}>{errors.telefono}</Text>}
            </View>
          </FadeInSection>

          {/* Términos y Condiciones */}
          <FadeInSection animationKey="terms" style={styles.termsSection}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleInputChange('aceptaTerminos', !datosFormulario.aceptaTerminos)}
            >
              <MaterialIcons
                name={datosFormulario.aceptaTerminos ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={datosFormulario.aceptaTerminos ? theme.primaryColor : theme.greyMedium}
              />
              <Text style={styles.checkboxText}>
                Acepto los <Text style={styles.linkText}>términos y condiciones</Text> *
              </Text>
            </TouchableOpacity>
            {errors.terminos && <Text style={styles.errorText}>{errors.terminos}</Text>}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleInputChange('aceptaMarketing', !datosFormulario.aceptaMarketing)}
            >
              <MaterialIcons
                name={datosFormulario.aceptaMarketing ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={datosFormulario.aceptaMarketing ? theme.primaryColor : theme.greyMedium}
              />
              <Text style={styles.checkboxText}>
                Acepto recibir comunicaciones comerciales
              </Text>
            </TouchableOpacity>
          </FadeInSection>

          {/* Botones de Acción */}
          <FadeInSection animationKey="action-buttons" style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={20} color={theme.primaryColor} />
              <Text style={styles.backButtonText}>Volver a Datos</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.payButton, isLoading && styles.payButtonDisabled]}
                onPress={procesarPago}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.white} style={{ marginRight: 8 }} />
                    <Text style={styles.loadingText}>Procesando...</Text>
                    <View style={styles.progressBarContainer}>
                      <Animated.View 
                        style={[
                          styles.progressBar,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            })
                          }
                        ]} 
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.payButtonContent}>
                    <MaterialCommunityIcons name="lock" size={24} color={theme.white} />
                    <Text style={styles.payButtonText}>
                      Pagar {precioTotal.toFixed(2)}€/mes
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
            </FadeInSection>
          
          <Text style={styles.securityText}>
            🔒 Pago 100% seguro y encriptado
          </Text>

          {/* Información de Seguridad */}
          <FadeInSection animationKey="security-info" style={styles.securitySection}>
            <View style={styles.securityHeader}>
              <MaterialCommunityIcons name="shield-check" size={24} color={theme.success} />
              <Text style={styles.securityTitle}>Pago Seguro</Text>
            </View>
            <View style={styles.securityFeatures}>
              <View style={styles.securityFeature}>
                <MaterialCommunityIcons name="lock" size={16} color={theme.success} />
                <Text style={styles.securityFeatureText}>Encriptación SSL 256-bit</Text>
              </View>
              <View style={styles.securityFeature}>
                <MaterialCommunityIcons name="credit-card-check" size={16} color={theme.success} />
                <Text style={styles.securityFeatureText}>Validación PCI DSS</Text>
              </View>
              <View style={styles.securityFeature}>
                <MaterialCommunityIcons name="bank" size={16} color={theme.success} />
                <Text style={styles.securityFeatureText}>Protección bancaria</Text>
              </View>
            </View>
            <Text style={styles.securityNote}>
              No almacenamos datos de tu tarjeta. Todos los pagos son procesados de forma segura.
            </Text>
          </FadeInSection>

        </Animated.View>
      </ScrollView>

      {/* Modal de Éxito */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  { 
                    scale: showModal ? 
                      scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }) : 0.3
                  }
                ]
              }
            ]}
          >
            <Animated.View style={{
              opacity: dogAnim,
              transform: [
                { scale: dogAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) },
                { translateY: dogAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }
              ],
              marginTop: 8,
              marginBottom: 8,
            }}>
              <MaterialCommunityIcons
                name="dog"
                size={80}
                color={pagoExitoso ? theme.success : theme.error}
              />
            </Animated.View>
            
            {pagoExitoso ? (
              <>
                <Text style={styles.modalTitle}>¡Pago Exitoso!</Text>
                <Text style={styles.modalText}>Tu suscripción ha sido activada correctamente.</Text>
                <Text style={styles.modalSubtext}>Recibirás un email de confirmación en breve.</Text>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: theme.error }]}>¡Pago Rechazado!</Text>
                <Text style={styles.modalText}>{mensajeError}</Text>
                <Text style={styles.modalSubtext}>Por favor, revisa los datos de tu tarjeta o prueba con otra.</Text>
              </>
            )}
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowModal(false);
                  router.replace('/');
                }}
              >
                <Text style={styles.modalButtonText}>Continuar</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.ultraLarge,
  },
  formContainer: {
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
    padding: spacing.medium,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    color: theme.greyMedium,
    textAlign: 'center',
    maxWidth: 400,
  },
  planSummary: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    marginBottom: spacing.large,
    ...theme.shadow,
    borderLeftWidth: 4,
    borderLeftColor: theme.primaryColor,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    marginLeft: spacing.medium,
  },
  summaryContent: {
    paddingLeft: spacing.large + 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.dark,
  },
  summaryPrice: {
    fontSize: 16,
    color: theme.greyMedium,
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    paddingTop: spacing.small,
    marginTop: spacing.small,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.secondaryColor,
  },
  summaryTotalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primaryColor,
  },
  sectionContainer: {
    marginBottom: spacing.large,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    marginBottom: spacing.medium,
  },
  paymentMethods: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.medium,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    padding: spacing.medium,
    flex: Platform.OS === 'web' ? 1 : undefined,
    ...theme.shadow,
  },
  paymentMethodActive: {
    backgroundColor: theme.primaryColor,
    borderColor: theme.primaryColor,
  },
  paymentMethodText: {
    fontSize: 16,
    color: theme.dark,
    marginLeft: spacing.medium,
    fontWeight: '500',
  },
  paymentMethodTextActive: {
    color: theme.white,
  },
  cardForm: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    marginBottom: spacing.large,
    ...theme.shadow,
  },
  contactForm: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    marginBottom: spacing.large,
    ...theme.shadow,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    marginBottom: spacing.medium,
  },
  inputContainer: {
    marginBottom: spacing.medium,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.secondaryColor,
    marginBottom: spacing.small,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    paddingHorizontal: spacing.medium,
    minHeight: 50,
  },
  inputError: {
    borderColor: theme.error,
  },
  inputIcon: {
    marginRight: spacing.small,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 16,
    color: theme.dark,
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
  },
  cardFormContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  cardInputError: {
    borderColor: '#ff3b30',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardColumn: {
    flex: 1,
    marginRight: 8,
  },
  cardColumnLast: {
    marginRight: 0,
  },
  cardIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  termsSection: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    marginBottom: spacing.large,
    ...theme.shadow,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  checkboxText: {
    fontSize: 14,
    color: theme.dark,
    marginLeft: spacing.small,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: theme.primaryColor,
    textDecorationLine: 'underline',
  },
  actionButtonsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.medium,
    marginTop: spacing.large,
    marginBottom: spacing.medium,
  },
  backButton: {
    backgroundColor: theme.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: theme.buttonBorderRadius,
    borderWidth: 2,
    borderColor: theme.primaryColor,
    ...theme.shadow,
    minWidth: Platform.OS === 'web' ? 180 : 280,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryColor,
    marginLeft: spacing.small,
  },
  payButton: {
    backgroundColor: theme.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.extraLarge,
    borderRadius: theme.buttonBorderRadius,
    ...theme.shadow,
    minWidth: Platform.OS === 'web' ? 220 : 280,
  },
  payButtonDisabled: {
    backgroundColor: theme.greyMedium,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.white,
    marginLeft: spacing.small,
  },
  securityText: {
    fontSize: 14,
    color: theme.greyMedium,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.extraLarge,
    alignItems: 'center',
    maxWidth: 400,
    margin: spacing.large,
    ...theme.shadow,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  modalText: {
    fontSize: 16,
    color: theme.dark,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  modalSubtext: {
    fontSize: 14,
    color: theme.greyMedium,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  modalButton: {
    backgroundColor: theme.primaryColor,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.extraLarge,
    borderRadius: theme.buttonBorderRadius,
    ...theme.shadow,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.white,
  },
  securitySection: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    marginTop: spacing.large,
    ...theme.shadow,
    borderLeftWidth: 4,
    borderLeftColor: theme.success,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    marginLeft: spacing.small,
  },
  securityFeatures: {
    marginBottom: spacing.medium,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  securityFeatureText: {
    fontSize: 14,
    color: theme.dark,
    marginLeft: spacing.small,
  },
  securityNote: {
    fontSize: 12,
    color: theme.greyMedium,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.white,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  progressBarContainer: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.white,
    borderRadius: 2,
  },
  animatedCard: {
    transform: [{ scale: 1 }],
  },
  cardHover: {
    transform: [{ scale: 1.02 }],
    elevation: 8,
    shadowOpacity: 0.15,
  },
  confettiContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 20,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 