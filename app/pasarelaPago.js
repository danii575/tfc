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
  import { doc, updateDoc, collection, setDoc } from 'firebase/firestore';
  import { db } from '../firebase/firebaseConfig';
  //hola 

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
    if (!/^\d{13,19}$/.test(numeroLimpio)) return false;
    
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
    
    return suma % 10 === 0;
  };

  const validarCVV = (cvv, tipoTarjeta) => {
    if (tipoTarjeta === 'amex') {
      return /^\d{4}$/.test(cvv);
    }
    return /^\d{3}$/.test(cvv);
  };

  const validarFechaExpiracion = (mes, año) => {
    const mesNum = parseInt(mes);
    const añoNum = parseInt(año);
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear() % 100;
    
    if (mesNum < 1 || mesNum > 12) return false;
    if (añoNum < añoActual) return false;
    if (añoNum === añoActual && mesNum < mesActual) return false;
    
    return true;
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
    
    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [datosFormulario, setDatosFormulario] = useState({
      numeroTarjeta: '',
      nombreTitular: '',
      mesExpiracion: '',
      añoExpiracion: '',
      cvv: '',
      email: user?.email || '',
      telefono: '',
      aceptaTerminos: false,
      aceptaMarketing: false,
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pagoExitoso, setPagoExitoso] = useState(false);
    const [tipoTarjeta, setTipoTarjeta] = useState('unknown');
    
    // Referencias para animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    
    // Datos del plan desde parámetros
    const planData = {
      nombre: params.planNombre || 'Plan Básico',
      precio: parseFloat(params.precioTotal) || 29.00,
      seguroCivil: params.seguroCivil === 'true',
      precioCivil: 15.00,
    };

    const precioTotal = planData.precio + (planData.seguroCivil ? planData.precioCivil : 0);

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

    const handleInputChange = (field, value) => {
      if (field === 'numeroTarjeta') {
        const numeroFormateado = formatearNumeroTarjeta(value);
        if (numeroFormateado.replace(/\s/g, '').length <= 19) {
          setDatosFormulario(prev => ({ ...prev, [field]: numeroFormateado }));
        }
      } else if (field === 'cvv') {
        const cvvLimpio = value.replace(/\D/g, '');
        const maxLength = tipoTarjeta === 'amex' ? 4 : 3;
        if (cvvLimpio.length <= maxLength) {
          setDatosFormulario(prev => ({ ...prev, [field]: cvvLimpio }));
        }
      } else if (field === 'mesExpiracion' || field === 'añoExpiracion') {
        const numeroLimpio = value.replace(/\D/g, '');
        if (numeroLimpio.length <= 2) {
          setDatosFormulario(prev => ({ ...prev, [field]: numeroLimpio }));
        }
      } else {
        setDatosFormulario(prev => ({ ...prev, [field]: value }));
      }
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
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
        if (!validarTarjeta(datosFormulario.numeroTarjeta)) {
          nuevosErrores.numeroTarjeta = 'Número de tarjeta inválido';
        }
        
        if (!datosFormulario.nombreTitular.trim()) {
          nuevosErrores.nombreTitular = 'Nombre del titular es obligatorio';
        }
        
        if (!validarFechaExpiracion(datosFormulario.mesExpiracion, datosFormulario.añoExpiracion)) {
          nuevosErrores.fechaExpiracion = 'Fecha de expiración inválida';
        }
        
        if (!validarCVV(datosFormulario.cvv, tipoTarjeta)) {
          nuevosErrores.cvv = `CVV inválido (${tipoTarjeta === 'amex' ? '4' : '3'} dígitos)`;
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
      
      // Animación de progreso
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
      
      try {
        // Simular procesamiento de pago
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Guardar información del pago en Firebase
        if (user) {
          const pagoData = {
            uidUsuario: user.uid,
            metodoPago: metodoPago,
            planNombre: planData.nombre,
            precioBase: planData.precio,
            seguroCivil: planData.seguroCivil,
            precioTotal: precioTotal,
            email: datosFormulario.email,
            telefono: datosFormulario.telefono,
            estado: 'completado',
            fechaPago: new Date().toISOString(),
            numeroTransaccion: `TXN-${Date.now()}`,
            ultimosCuatroDigitos: metodoPago === 'tarjeta' ? 
              datosFormulario.numeroTarjeta.replace(/\s/g, '').slice(-4) : null,
          };

          await setDoc(doc(collection(db, 'pagos')), pagoData);
          
          // Actualizar estado del usuario
          const userRef = doc(db, "usuarios", user.uid);
          await updateDoc(userRef, {
            planActivo: planData.nombre,
            fechaActivacion: new Date().toISOString(),
            estadoPago: 'activo',
          });
        }
        
        setPagoExitoso(true);
        setShowModal(true);
        
      } catch (error) {
        console.error("Error procesando pago:", error);
        Alert.alert('Error', 'Hubo un error procesando el pago. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    const getTarjetaIcon = () => {
      switch (tipoTarjeta) {
        case 'visa': return 'cc-visa';
        case 'mastercard': return 'cc-mastercard';
        case 'amex': return 'cc-amex';
        case 'discover': return 'cc-discover';
        default: return 'credit-card';
      }
    };

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
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Número de Tarjeta *</Text>
                  <View style={[styles.inputWrapper, errors.numeroTarjeta && styles.inputError]}>
                    <FontAwesome5 
                      name={getTarjetaIcon()} 
                      size={20} 
                      color={tipoTarjeta !== 'unknown' ? theme.primaryColor : theme.greyMedium} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      value={datosFormulario.numeroTarjeta}
                      onChangeText={(value) => handleInputChange('numeroTarjeta', value)}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="numeric"
                      placeholderTextColor={theme.greyMedium}
                    />
                  </View>
                  {errors.numeroTarjeta && <Text style={styles.errorText}>{errors.numeroTarjeta}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre del Titular *</Text>
                  <View style={[styles.inputWrapper, errors.nombreTitular && styles.inputError]}>
                    <MaterialIcons name="person" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={datosFormulario.nombreTitular}
                      onChangeText={(value) => handleInputChange('nombreTitular', value)}
                      placeholder="Nombre como aparece en la tarjeta"
                      placeholderTextColor={theme.greyMedium}
                    />
                  </View>
                  {errors.nombreTitular && <Text style={styles.errorText}>{errors.nombreTitular}</Text>}
                </View>

                <View style={styles.cardRow}>
                  <View style={[styles.inputContainer, styles.cardRowItem]}>
                    <Text style={styles.label}>Mes *</Text>
                    <View style={[styles.inputWrapper, errors.fechaExpiracion && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        value={datosFormulario.mesExpiracion}
                        onChangeText={(value) => handleInputChange('mesExpiracion', value)}
                        placeholder="MM"
                        keyboardType="numeric"
                        maxLength={2}
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.cardRowItem]}>
                    <Text style={styles.label}>Año *</Text>
                    <View style={[styles.inputWrapper, errors.fechaExpiracion && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        value={datosFormulario.añoExpiracion}
                        onChangeText={(value) => handleInputChange('añoExpiracion', value)}
                        placeholder="AA"
                        keyboardType="numeric"
                        maxLength={2}
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.cardRowItem]}>
                    <Text style={styles.label}>CVV *</Text>
                    <View style={[styles.inputWrapper, errors.cvv && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        value={datosFormulario.cvv}
                        onChangeText={(value) => handleInputChange('cvv', value)}
                        placeholder={tipoTarjeta === 'amex' ? '1234' : '123'}
                        keyboardType="numeric"
                        secureTextEntry
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                  </View>
                </View>
                {errors.fechaExpiracion && <Text style={styles.errorText}>{errors.fechaExpiracion}</Text>}
                {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
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
                  <>
                    <MaterialCommunityIcons name="lock" size={24} color={theme.white} />
                    <Text style={styles.payButtonText}>
                      Pagar {precioTotal.toFixed(2)}€/mes
                    </Text>
                  </>
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
              {/* Efecto de confeti */}
              <View style={styles.confettiContainer}>
                {[...Array(8)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.confetti,
                      {
                        backgroundColor: i % 2 === 0 ? theme.primaryColor : theme.accentColor,
                        transform: [
                          {
                            translateY: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-20, 100],
                            })
                          },
                          {
                            rotate: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            })
                          }
                        ],
                        left: `${(i * 12) + 10}%`,
                      }
                    ]}
                  />
                ))}
              </View>
              
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons name="check-circle" size={64} color={theme.success} />
              </Animated.View>
              
              <Text style={styles.modalTitle}>¡Pago Exitoso!</Text>
              <Text style={styles.modalText}>
                Tu suscripción ha sido activada correctamente.
              </Text>
              <Text style={styles.modalSubtext}>
                Recibirás un email de confirmación en breve.
              </Text>
              
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
    cardRow: {
      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
      gap: spacing.medium,
    },
    cardRowItem: {
      flex: Platform.OS === 'web' ? 1 : undefined,
    },
    errorText: {
      color: theme.error,
      fontSize: 13,
      marginTop: spacing.small,
      fontWeight: '500',
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
      top: 0,
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
  }); 