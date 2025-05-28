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
  Switch,
  Modal,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/Header';
import { FadeInSection } from '../components/FadeInSection';
import { useAuth } from './_layout';
import provincias from '../data/provincias.json';
import comunidades from '../data/comunidades.json';
import { doc, updateDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { updateProfile } from 'firebase/auth';

// --- Definiciones de Tema y Estilo ---
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
  cardBackground: 'rgba(42,157,143,0.10)', // verde suave
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

const typography = {
  heading1: { fontSize: Platform.OS === 'web' ? 32 : 28, fontWeight: 'bold', color: theme.secondaryColor },
  heading2: { fontSize: Platform.OS === 'web' ? 26 : 22, fontWeight: 'bold', color: theme.secondaryColor },
  heading3: { fontSize: Platform.OS === 'web' ? 20 : 18, fontWeight: '600', color: theme.secondaryColor },
  body: { fontSize: 16, color: theme.dark, lineHeight: 24 },
  button: { fontSize: 16, fontWeight: '600', color: theme.white, textAlign: 'center' },
  caption: { fontSize: 12, color: theme.greyMedium },
};

const spacing = { small: 8, medium: 14, large: 20, extraLarge: 28, ultraLarge: 48 };

// Tipos de vía para el desplegablea
const tiposVia = [
  { value: 'calle', label: 'Calle' },
  { value: 'avenida', label: 'Avenida' },
  { value: 'plaza', label: 'Plaza' },
  { value: 'paseo', label: 'Paseo' },
  { value: 'camino', label: 'Camino' },
  { value: 'carretera', label: 'Carretera' },
  { value: 'travesia', label: 'Travesía' },
  { value: 'ronda', label: 'Ronda' },
  { value: 'glorieta', label: 'Glorieta' },
  { value: 'urbanizacion', label: 'Urbanización' },
  { value: 'barrio', label: 'Barrio' },
  { value: 'sector', label: 'Sector' },
  { value: 'poligono', label: 'Polígono' },
  { value: 'otros', label: 'Otros' }
];

// Componente específico para el campo del microchip
const ChipInput = ({ index, value, onChangeText, error }) => {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 15);
    setLocalValue(numericValue);
    onChangeText(numericValue);
  };

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <View style={chipInputStyles.container}>
      <Text style={chipInputStyles.label}>Número de Chip *</Text>
      <View style={[chipInputStyles.inputWrapper, error && chipInputStyles.inputError]}>
        <MaterialIcons name="memory" size={20} color={theme.greyMedium} style={chipInputStyles.icon} />
        <TextInput
          style={chipInputStyles.input}
          value={localValue}
          onChangeText={handleChange}
          placeholder="15 dígitos numéricos"
          keyboardType="numeric"
          maxLength={15}
          placeholderTextColor={theme.greyMedium}
        />
      </View>
      {error && <Text style={chipInputStyles.errorText}>{error}</Text>}
    </View>
  );
};

const chipInputStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
    width: '100%',
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
    ...theme.shadow,
  },
  inputError: {
    borderColor: theme.error,
  },
  icon: {
    marginRight: spacing.small,
    color: theme.greyMedium,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 16,
    color: theme.dark,
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: theme.error,
    fontSize: 13,
    marginTop: spacing.small,
    fontWeight: '500',
  },
});

// --- Funciones de Validación ---
const validarDNI = (dni) => {
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  if (!dniRegex.test(dni)) return false;

  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const numero = parseInt(dni.substring(0, 8));
  const letra = dni.substring(8).toUpperCase();
  
  return letras[numero % 23] === letra;
};

const validarNIE = (nie) => {
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (!nieRegex.test(nie)) return false;
  let nieNum = nie;
  nieNum = nieNum.replace('X', '0').replace('Y', '1').replace('Z', '2');
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const numero = parseInt(nieNum.substring(0, 8));
  const letra = nieNum.substring(8).toUpperCase();
  return letras[numero % 23] === letra;
};

const validarChip = (chip) => {
  return /^[0-9]{15}$/.test(chip);
};

const validarDireccionCompleta = (tipoVia, nombreVia, numero, piso, puerta) => {
  return {
    tipoVia: tipoVia.trim() !== '',
    nombreVia: nombreVia.trim().length >= 3,
    numero: numero.trim() !== '' && /^\d+[A-Za-z]?$/.test(numero.trim()),
    piso: piso.trim() !== '',
    puerta: puerta.trim() !== ''
  };
};

const validarCodigoPostal = (cp) => {
  return /^[0-9]{5}$/.test(cp);
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 0; // Handle empty date
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return 0; // Handle invalid date

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};

const PLANS_DATA = [
  { 
    id: "plan1", 
    name: "Básico", 
    price: "29€/mes", 
    icon: "leaf",
    basePriceMonthly: "29.00", 
    priceDisplay: "Desde 29.00€/mes", 
    teaser: "La protección esencial para el día a día de tu mascota, ideal para cubrir lo fundamental.",
    features: [
      "Consulta anual de bienestar veterinario",
      "Descuento en el esquema de vacunación anual",
      "Soporte 24/7 vía app",
      "Cobertura básica de emergencias"
    ],
  },
  // ... otros planes
];

// --- Componente Principal ---
export default function DatosCompletosPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    fechaNacimiento: '',
    tipoVia: '',
    nombreVia: '',
    numero: '',
    piso: '',
    puerta: '',
    escalera: '',
    codigoPostal: '',
    provincia: '',
    comunidadAutonoma: '',
    mascotas: []
  });
  const [errors, setErrors] = useState({});
  const [showResumen, setShowResumen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [seguroCivil, setSeguroCivil] = useState(false);
  const [precioCivil] = useState(15.00);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [initializedAnimalsParam, setInitializedAnimalsParam] = useState(null);
  const [hasInitializedAnimals, setHasInitializedAnimals] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const isWeb = Platform.OS === 'web';
  
  // Referencias para animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("[DatosCompletos] useEffect ejecutándose");
    console.log("[DatosCompletos] Parámetros recibidos:", params);
    console.log("[DatosCompletos] hasInitializedAnimals:", hasInitializedAnimals);
    console.log("[DatosCompletos] isInitializing:", isInitializing);

    // Evitar múltiples inicializaciones simultáneas
    if (isInitializing) {
      console.log("[DatosCompletos] Ya se está inicializando, saltando...");
      return;
    }

    // Manejo del plan seleccionado
    if (params.selectedPlanId && params.planNombre) {
      const planSeleccionado = {
        id: params.selectedPlanId,
        nombre: params.planNombre,
        precio: parseFloat(params.precioEstimado?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      };
      
      setFormData(prev => {
        // Solo actualizar si es diferente para evitar bucles
        if (JSON.stringify(prev.planSeleccionado) !== JSON.stringify(planSeleccionado)) {
          console.log("[DatosCompletos] Actualizando plan seleccionado:", planSeleccionado);
          return { ...prev, planSeleccionado: planSeleccionado };
        }
        return prev;
      });
    }

    // Manejo de la inicialización de mascotas - SOLO UNA VEZ
    if (params.animals && !hasInitializedAnimals) {
      console.log("[DatosCompletos] Iniciando primera inicialización de mascotas");
      setIsInitializing(true);
      
      try {
        const animals = JSON.parse(params.animals);
        console.log("[DatosCompletos] Animales parseados:", animals);
        
        if (Array.isArray(animals) && animals.length > 0) {
          const mascotasFormateadas = animals.map(animal => ({
            nombre: animal.nombre || '',
            tipo: animal.tipo || '',
            raza: animal.raza || '',
            sexo: animal.sexo || '',
            edad: animal.edad || '',
            chip: '' // Inicializar vacío solo la primera vez
          }));
          
          console.log("[DatosCompletos] Mascotas formateadas (primera inicialización):", mascotasFormateadas);
          
          setFormData(prev => ({
            ...prev,
            mascotas: mascotasFormateadas
          }));
          
          // Marcar como inicializado
          setHasInitializedAnimals(true);
          console.log("[DatosCompletos] Marcando como inicializado");
        }
        
      } catch (e) {
        console.error("[DatosCompletos] Error parseando animals:", e);
      } finally {
        setIsInitializing(false);
      }
    } else if (params.animals && hasInitializedAnimals) {
      console.log("[DatosCompletos] Ya se inicializó previamente, manteniendo datos existentes");
      
      // Solo actualizar datos básicos si es necesario, preservar chips
      try {
        const animals = JSON.parse(params.animals);
        console.log("[DatosCompletos] Animales para actualización:", animals);
        
        setFormData(prev => {
          const mascotasExistentes = prev.mascotas || [];
          console.log("[DatosCompletos] Mascotas existentes:", mascotasExistentes);
          
          // Solo actualizar si hay cambios en datos básicos, preservar chips
          const mascotasActualizadas = animals.map((animal, index) => {
            const mascotaExistente = mascotasExistentes[index];
            
            if (mascotaExistente) {
              // Preservar chip existente, actualizar solo datos básicos si han cambiado
              const datosBasicosIguales = 
                mascotaExistente.nombre === (animal.nombre || '') &&
                mascotaExistente.tipo === (animal.tipo || '') &&
                mascotaExistente.raza === (animal.raza || '') &&
                mascotaExistente.sexo === (animal.sexo || '') &&
                mascotaExistente.edad === (animal.edad || '');
              
              if (datosBasicosIguales) {
                // No hay cambios, mantener todo igual
                return mascotaExistente;
              } else {
                // Hay cambios en datos básicos, actualizar pero preservar chip
                return {
                  ...mascotaExistente,
                  nombre: animal.nombre || mascotaExistente.nombre,
                  tipo: animal.tipo || mascotaExistente.tipo,
                  raza: animal.raza || mascotaExistente.raza,
                  sexo: animal.sexo || mascotaExistente.sexo,
                  edad: animal.edad || mascotaExistente.edad,
                  // chip se mantiene tal como está
                };
              }
            } else {
              // Nueva mascota
              return {
                nombre: animal.nombre || '',
                tipo: animal.tipo || '',
                raza: animal.raza || '',
                sexo: animal.sexo || '',
                edad: animal.edad || '',
                chip: ''
              };
            }
          });
          
          // Solo actualizar si hay cambios reales
          const hayDiferencias = JSON.stringify(mascotasExistentes) !== JSON.stringify(mascotasActualizadas);
          
          if (hayDiferencias) {
            console.log("[DatosCompletos] Actualizando mascotas preservando chips:", mascotasActualizadas);
            return {
              ...prev,
              mascotas: mascotasActualizadas
            };
          } else {
            console.log("[DatosCompletos] No hay cambios, manteniendo estado actual");
            return prev;
          }
        });
        
      } catch (e) {
        console.error("[DatosCompletos] Error en actualización de animals:", e);
      }
    }

  }, [
    params.animals, 
    params.selectedPlanId, 
    params.planNombre, 
    params.precioEstimado,
    hasInitializedAnimals // Dependencia importante para controlar la inicialización
  ]);

  // Animaciones de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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

    // Animación de pulso para el botón principal
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const validateForm = () => {
    return validarFormulario();
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

  const handleSubmit = async () => {
    console.log("[DatosCompletos] Iniciando handleSubmit");
    console.log("[DatosCompletos] FormData actual:", formData);
    console.log("[DatosCompletos] Errores actuales:", errors);
    
    const isValid = validarFormulario();
    console.log("[DatosCompletos] Formulario válido:", isValid);
    
    if (!isValid) {
      console.log("[DatosCompletos] Formulario inválido, mostrando errores:", errors);
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    try {
      setIsLoading(true);
      console.log("[DatosCompletos] Iniciando guardado en Firebase");
      
      // Guardar datos en Firebase
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
          tipoDocumento: formData.tipoDocumento,
          numeroDocumento: formData.numeroDocumento,
          fechaNacimiento: formData.fechaNacimiento,
          tipoVia: formData.tipoVia,
          nombreVia: formData.nombreVia,
          numero: formData.numero,
          piso: formData.piso,
          puerta: formData.puerta,
          escalera: formData.escalera,
          codigoPostal: formData.codigoPostal,
          provincia: formData.provincia,
          comunidadAutonoma: formData.comunidadAutonoma,
          mascotas: formData.mascotas,
          ultimaActualizacion: new Date().toISOString()
        });

        // Si viene del registro con datos de presupuesto, guardar también el presupuesto
        if (params.fromRegistro === 'true' && params.animals) {
          try {
            const animals = JSON.parse(params.animals);
            const presupuestoData = {
              uidUsuario: user.uid,
              animals: animals,
              ownerData: {
                nombre: user.displayName || '',
                email: user.email,
                telefono: formData.telefono || ''
              },
              howHeard: params.howHeard || '',
              selectedPlanId: params.selectedPlanId || '',
              planNombre: params.planNombre || '',
              precioEstimado: params.precioEstimado || '',
              numeroMascotas: params.numeroMascotas || '0',
              status: "completado",
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString()
            };

            await setDoc(doc(collection(db, 'presupuestos')), presupuestoData);
            console.log("[DatosCompletos] Presupuesto guardado exitosamente");
          } catch (error) {
            console.error("[DatosCompletos] Error al guardar presupuesto:", error);
          }
        }

        // Calcular precio final
        const planPrice = formData.planSeleccionado?.precio ? parseFloat(formData.planSeleccionado.precio) : 0;
        const finalPrice = planPrice + (seguroCivil ? precioCivil : 0);

        // Redirigir a la pasarela de pago con los datos del plan
        console.log("[DatosCompletos] Preparando navegación a pasarela de pago");
        console.log("[DatosCompletos] Plan seleccionado:", formData.planSeleccionado);
        console.log("[DatosCompletos] Seguro civil:", seguroCivil);
        console.log("[DatosCompletos] Precio final:", finalPrice);
        
        const pagoParams = {
          planNombre: formData.planSeleccionado?.nombre || 'Plan Básico',
          precioBase: formData.planSeleccionado?.precio?.toString() || '29.00',
          seguroCivil: seguroCivil.toString(),
          precioTotal: finalPrice.toString(),
          fromDatosCompletos: 'true',
          userId: user.uid
        };
        
        console.log("[DatosCompletos] Parámetros de pago:", pagoParams);
        
        try {
          console.log("[DatosCompletos] Ejecutando router.push...");
          await router.push({
            pathname: '/pasarelaPago',
            params: pagoParams
          });
          console.log("[DatosCompletos] router.push ejecutado exitosamente");
        } catch (routerError) {
          console.error("[DatosCompletos] Error en router.push:", routerError);
          Alert.alert('Error', 'Error al navegar a la pasarela de pago');
        }
      }
    } catch (error) {
      console.error("[DatosCompletos] Error al guardar datos:", error);
      Alert.alert('Error', 'Hubo un error al guardar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };



  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString();
      handleInputChange('fechaNacimiento', formattedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (formData.tipoDocumento === 'DNI' && !validarDNI(formData.numeroDocumento)) {
      nuevosErrores.numeroDocumento = 'DNI inválido';
    }
    if (formData.tipoDocumento === 'NIE' && !validarNIE(formData.numeroDocumento)) {
      nuevosErrores.numeroDocumento = 'NIE inválido';
    }
    if (!formData.numeroDocumento) {
        nuevosErrores.numeroDocumento = 'El DNI/NIE es obligatorio.';
    }

    if (!formData.fechaNacimiento) {
        nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
    } else {
        const edad = calcularEdad(formData.fechaNacimiento);
        if (edad < 18) {
            nuevosErrores.fechaNacimiento = 'Debes ser mayor de 18 años.';
        }
    }

    if (!validarCodigoPostal(formData.codigoPostal)) {
      nuevosErrores.codigoPostal = 'Código postal inválido (5 dígitos).';
    }
     if (!formData.codigoPostal) {
        nuevosErrores.codigoPostal = 'El código postal es obligatorio.';
    }

    // Validar campos de dirección
    const validacionDireccion = validarDireccionCompleta(
      formData.tipoVia, 
      formData.nombreVia, 
      formData.numero, 
      formData.piso, 
      formData.puerta
    );
    
    if (!validacionDireccion.tipoVia) {
      nuevosErrores.tipoVia = 'Selecciona el tipo de vía.';
    }
    if (!validacionDireccion.nombreVia) {
      nuevosErrores.nombreVia = 'El nombre de la vía debe tener al menos 3 caracteres.';
    }
    if (!validacionDireccion.numero) {
      nuevosErrores.numero = 'Número inválido (ej: 123, 45A).';
    }
    if (!validacionDireccion.piso) {
      nuevosErrores.piso = 'El piso es obligatorio.';
    }
    if (!validacionDireccion.puerta) {
      nuevosErrores.puerta = 'La puerta es obligatoria.';
    }
    
    if (!formData.provincia) {
        nuevosErrores.provincia = 'La provincia es obligatoria.';
    }
    if (!formData.comunidadAutonoma) {
        nuevosErrores.comunidadAutonoma = 'La comunidad autónoma es obligatoria.';
    }

    formData.mascotas.forEach((mascota, index) => {
      if (!validarChip((mascota.chip || '').replace(/\D/g, ''))) {
        nuevosErrores[`mascota_${index}`] = 'Chip inválido (15 dígitos).';
      }
      if (!mascota.chip) {
         nuevosErrores[`mascota_${index}`] = 'El chip de la mascota es obligatorio.';
      }
    });

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Calculate total price for summary
  const planPrice = formData.planSeleccionado?.precio ? parseFloat(formData.planSeleccionado.precio) : 0;
  const finalPrice = planPrice + (seguroCivil ? precioCivil : 0);

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
          {!showResumen ? (
            <>
              <FadeInSection animationKey="form-header" style={styles.headerSection}>
                {/* Partículas flotantes de fondo */}
                <View style={styles.particlesContainer}>
                  {[...Array(6)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.particle,
                        {
                          left: `${(i * 15) + 10}%`,
                          animationDelay: `${i * 0.5}s`,
                          transform: [
                            {
                              translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -20],
                              })
                            }
                          ]
                        }
                      ]}
                    />
                  ))}
                </View>
                
                <Text style={styles.pageTitle}>Completa tus Datos</Text>
                <Text style={styles.pageSubtitle}>Necesitamos algunos datos adicionales para procesar tu solicitud.</Text>
              </FadeInSection>

              {formData.planSeleccionado && (
                <FadeInSection animationKey="plan-info" style={styles.planInfoContainer}>
                  <View style={styles.planInfoHeader}>
                    <MaterialCommunityIcons name="shield-check-outline" size={24} color={theme.primaryColor} />
                    <Text style={styles.planInfoTitle}>Plan Seleccionado</Text>
                  </View>
                  <View style={styles.planInfoContent}>
                    <View style={styles.planInfoLeft}>
                      <Text style={styles.planInfoName}>{formData.planSeleccionado.nombre}</Text>
                      <Text style={styles.planInfoSubtitle}>Plan de Seguro</Text>
                    </View>
                    <View style={styles.planInfoRight}>
                      <Text style={styles.planInfoPrice}>{formData.planSeleccionado.precio?.toFixed(2)}€/mes</Text>
                    </View>
                  </View>
                </FadeInSection>
              )}

              <FadeInSection animationKey="personal-data" style={styles.sectionContainer}>
                <View style={styles.sectionHeaderAnimated}>
                  <MaterialCommunityIcons name="account-outline" size={24} color={theme.primaryColor} />
                  <Text style={styles.sectionTitle}>Datos Personales</Text>
                </View>
                <View style={styles.cardContainer}>
                  {/* Efecto de brillo sutil */}
                  <View style={styles.cardGlow} />
                  {/* Los campos de nombre y apellidos se eliminan ya que se guardan en el registro */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tipo de Documento *</Text>
                    <View style={styles.docTypeRowCustom}>
                      <Pressable
                        style={[styles.docTypeButtonPill, formData.tipoDocumento === 'DNI' && styles.docTypeButtonPillActive]}
                        onPress={() => handleInputChange('tipoDocumento', 'DNI')}
                      >
                        <MaterialIcons name="badge" size={20} color={formData.tipoDocumento === 'DNI' ? theme.white : theme.primaryColor} style={{marginRight: 8}} />
                        <Text style={[styles.docTypeButtonTextPill, formData.tipoDocumento === 'DNI' && styles.docTypeButtonTextPillActive]}>DNI</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.docTypeButtonPill, formData.tipoDocumento === 'NIE' && styles.docTypeButtonPillActive]}
                        onPress={() => handleInputChange('tipoDocumento', 'NIE')}
                      >
                        <MaterialIcons name="credit-card" size={20} color={formData.tipoDocumento === 'NIE' ? theme.white : theme.primaryColor} style={{marginRight: 8}} />
                        <Text style={[styles.docTypeButtonTextPill, formData.tipoDocumento === 'NIE' && styles.docTypeButtonTextPillActive]}>NIE</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{formData.tipoDocumento} *</Text>
                    <View style={[styles.inputWrapper, errors.numeroDocumento && styles.inputError]}>
                      <MaterialIcons name={formData.tipoDocumento === 'DNI' ? "badge" : "credit-card"} size={20} color={theme.greyMedium} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputNoOutline}
                        value={formData.numeroDocumento}
                        onChangeText={(value) => handleInputChange('numeroDocumento', value.toUpperCase())}
                        placeholder={`Introduce tu ${formData.tipoDocumento}`}
                        maxLength={9}
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                    {errors.numeroDocumento && <Text style={styles.errorText}>{errors.numeroDocumento}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Fecha de Nacimiento *</Text>
                    {isWeb ? (
                      <View style={styles.dateInputContainer}>
                         <TouchableOpacity 
                          style={[
                            styles.dateInputWrapper, 
                            errors.fechaNacimiento && styles.inputError
                          ]}
                          onPress={() => {
                            const input = document.getElementById('fechaNacInput');
                            if (input && typeof input.showPicker === 'function') {
                              input.showPicker();
                            } else if (input) {
                               input.click();
                            }
                          }}
                        >
                          <MaterialIcons name="calendar-today" size={20} color={theme.primaryColor} style={styles.inputIcon} />
                          <Text style={[
                            styles.dateInputText, 
                            !formData.fechaNacimiento || isNaN(new Date(formData.fechaNacimiento).getTime()) 
                              ? { color: theme.greyMedium } 
                              : {}
                          ]}>
                            {formData.fechaNacimiento && !isNaN(new Date(formData.fechaNacimiento).getTime())
                              ? new Date(formData.fechaNacimiento).toLocaleDateString('es-ES', {
                                  year: 'numeric', month: 'long', day: 'numeric'
                                })
                              : 'dd/mm/aaaa'}
                          </Text>
                        </TouchableOpacity>
                        <input
                          id="fechaNacInput"
                          type="date"
                          value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString().split('T')[0] : ''}
                          onChange={e => {
                            if (e.target.value) {
                              const selectedDate = new Date(e.target.value + "T00:00:00Z");
                              handleInputChange('fechaNacimiento', selectedDate.toISOString());
                            } else {
                              handleInputChange('fechaNacimiento', '');
                            }
                          }}
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0, zIndex: -1 }}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.dateInputWrapper, errors.fechaNacimiento && styles.inputError]}
                        onPress={showDatepicker}
                      >
                        <MaterialIcons name="calendar-today" size={20} color={theme.primaryColor} style={styles.inputIcon} />
                        <Text style={[
                          styles.dateInputText, 
                          !formData.fechaNacimiento || isNaN(new Date(formData.fechaNacimiento).getTime()) 
                            ? { color: theme.greyMedium } 
                            : {}
                        ]}>
                          {formData.fechaNacimiento && !isNaN(new Date(formData.fechaNacimiento).getTime())
                            ? new Date(formData.fechaNacimiento).toLocaleDateString('es-ES', {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })
                            : 'dd/mm/aaaa'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!isWeb && showDatePicker && (
                      <DateTimePicker
                        value={formData.fechaNacimiento && !isNaN(new Date(formData.fechaNacimiento).getTime()) 
                          ? new Date(formData.fechaNacimiento) 
                          : new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        locale="es-ES"
                      />
                    )}
                    {errors.fechaNacimiento && <Text style={styles.errorText}>{errors.fechaNacimiento}</Text>}
                  </View>

                  {/* Sección de Dirección Completa */}
                  <View style={styles.direccionSection}>
                    <Text style={[styles.label, styles.direccionSectionTitle]}>Dirección Completa</Text>
                    
                    {/* Tipo de Vía */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Tipo de Vía *</Text>
                      {isWeb ? (
                        <View style={[styles.inputWrapper, styles.selectWrapper, errors.tipoVia && styles.inputError]}>
                          <MaterialIcons name="signpost" size={20} color={theme.greyMedium} style={styles.inputIcon} /><select
                            value={formData.tipoVia}
                            onChange={e => handleInputChange('tipoVia', e.target.value)}
                            style={styles.selectCustom}
                            aria-label="Selecciona tipo de vía"
                          ><option value="">Selecciona tipo de vía</option>{tiposVia.map(tipo => (<option key={tipo.value} value={tipo.value}>{tipo.label}</option>))}</select>
                        </View>
                      ) : (
                        <View style={styles.inputContainer}>
                          <Text style={styles.placeholderText}>(Implementar Picker Nativo para Tipo de Vía)</Text>
                        </View>
                      )}
                      {errors.tipoVia && <Text style={styles.errorText}>{errors.tipoVia}</Text>}
                    </View>

                    {/* Nombre de la Vía */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Nombre de la Vía *</Text>
                      <View style={[styles.inputWrapper, errors.nombreVia && styles.inputError]}>
                        <MaterialIcons name="edit-road" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputNoOutline}
                          value={formData.nombreVia}
                          onChangeText={(value) => handleInputChange('nombreVia', value)}
                          placeholder="Ej: Gran Vía, del Sol, Mayor"
                          placeholderTextColor={theme.greyMedium}
                        />
                      </View>
                      {errors.nombreVia && <Text style={styles.errorText}>{errors.nombreVia}</Text>}
                    </View>

                    {/* Fila con Número, Piso, Puerta */}
                    <View style={styles.direccionRow}>
                      <View style={[styles.inputContainer, styles.direccionRowItem]}>
                        <Text style={styles.label}>Número *</Text>
                        <View style={[styles.inputWrapper, errors.numero && styles.inputError]}>
                          <MaterialIcons name="tag" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                          <TextInput
                            style={styles.inputNoOutline}
                            value={formData.numero}
                            onChangeText={(value) => handleInputChange('numero', value)}
                            placeholder="123"
                            placeholderTextColor={theme.greyMedium}
                          />
                        </View>
                        {errors.numero && <Text style={styles.errorText}>{errors.numero}</Text>}
                      </View>

                      <View style={[styles.inputContainer, styles.direccionRowItem]}>
                        <Text style={styles.label}>Piso *</Text>
                        <View style={[styles.inputWrapper, errors.piso && styles.inputError]}>
                          <MaterialIcons name="layers" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                          <TextInput
                            style={styles.inputNoOutline}
                            value={formData.piso}
                            onChangeText={(value) => handleInputChange('piso', value)}
                            placeholder="4º"
                            placeholderTextColor={theme.greyMedium}
                          />
                        </View>
                        {errors.piso && <Text style={styles.errorText}>{errors.piso}</Text>}
                      </View>

                      <View style={[styles.inputContainer, styles.direccionRowItem]}>
                        <Text style={styles.label}>Puerta *</Text>
                        <View style={[styles.inputWrapper, errors.puerta && styles.inputError]}>
                          <MaterialIcons name="door-front" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                          <TextInput
                            style={styles.inputNoOutline}
                            value={formData.puerta}
                            onChangeText={(value) => handleInputChange('puerta', value)}
                            placeholder="A"
                            placeholderTextColor={theme.greyMedium}
                          />
                        </View>
                        {errors.puerta && <Text style={styles.errorText}>{errors.puerta}</Text>}
                      </View>
                    </View>

                    {/* Escalera (Opcional) */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Escalera (Opcional)</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons name="stairs" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputNoOutline}
                          value={formData.escalera}
                          onChangeText={(value) => handleInputChange('escalera', value)}
                          placeholder="Ej: Izquierda, Derecha, Central"
                          placeholderTextColor={theme.greyMedium}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Código Postal *</Text>
                    <View style={[styles.inputWrapper, errors.codigoPostal && styles.inputError]}>
                      <MaterialIcons name="local-post-office" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputNoOutline}
                        value={formData.codigoPostal}
                        onChangeText={(value) => handleInputChange('codigoPostal', value.replace(/[^0-9]/g, ''))}
                        placeholder="Ej: 28001"
                        keyboardType="numeric"
                        maxLength={5}
                        placeholderTextColor={theme.greyMedium}
                      />
                    </View>
                    {errors.codigoPostal && <Text style={styles.errorText}>{errors.codigoPostal}</Text>}
                  </View>
                  
                  {isWeb && (
                    <>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Provincia *</Text>
                        <View style={[styles.inputWrapper, styles.selectWrapper, errors.provincia && styles.inputError]}>
                        <MaterialIcons name="location-city" size={20} color={theme.greyMedium} style={styles.inputIcon} /><select
                            value={formData.provincia}
                            onChange={e => handleInputChange('provincia', e.target.value)}
                            style={styles.selectCustom}
                            aria-label="Selecciona provincia"
                          ><option value="">Selecciona provincia</option>{provincias.map(p => (<option key={p.value || p.label} value={p.value || p.label}>{p.label || p}</option>))}</select>
                        </View>
                        {errors.provincia && <Text style={styles.errorText}>{errors.provincia}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Comunidad Autónoma *</Text>
                        <View style={[styles.inputWrapper, styles.selectWrapper, errors.comunidadAutonoma && styles.inputError]}>
                        <MaterialIcons name="map" size={20} color={theme.greyMedium} style={styles.inputIcon} /><select
                            value={formData.comunidadAutonoma}
                            onChange={e => handleInputChange('comunidadAutonoma', e.target.value)}
                            style={styles.selectCustom}
                            aria-label="Selecciona comunidad autónoma"
                          ><option value="">Selecciona comunidad</option>{comunidades.map(c => (<option key={c.value || c.label} value={c.value || c.label}>{c.label || c}</option>))}</select>
                        </View>
                        {errors.comunidadAutonoma && <Text style={styles.errorText}>{errors.comunidadAutonoma}</Text>}
                    </View>
                    </>
                  )}
                   {!isWeb && (
                    <>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Provincia * (Picker para Nativo)</Text>
                            <Text style={styles.placeholderText}>(Implementar Picker Nativo para Provincia)</Text>
                            {errors.provincia && <Text style={styles.errorText}>{errors.provincia}</Text>}
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Comunidad Autónoma * (Picker para Nativo)</Text>
                            <Text style={styles.placeholderText}>(Implementar Picker Nativo para Comunidad)</Text>
                            {errors.comunidadAutonoma && <Text style={styles.errorText}>{errors.comunidadAutonoma}</Text>}
                        </View>
                    </>
                   )}


                </View>
              </FadeInSection>

              <FadeInSection animationKey="pets-data" style={styles.sectionContainer}>
                <View style={styles.sectionHeaderAnimated}>
                  <MaterialCommunityIcons name="paw" size={24} color={theme.primaryColor} />
                  <Text style={styles.sectionTitle}>Datos de las Mascotas</Text>
                  <View style={styles.petCountBadge}>
                    <Text style={styles.petCountText}>{formData.mascotas.length}</Text>
                  </View>
                </View>
                {formData.mascotas.length === 0 && (
                  <View style={styles.noAnimalsContainer}>
                    <Text style={styles.noAnimalsText}>No hay mascotas para mostrar. Verifica que los datos se hayan cargado correctamente.</Text>
                  </View>
                )}
                {formData.mascotas.map((mascota, index) => (
                  <View key={index} style={styles.petCard}>
                    <View style={styles.petCardHeader}>
                      <MaterialCommunityIcons name={mascota.tipo === 'gato' ? "cat" : "dog"} size={24} color={theme.primaryColor} />
                      <Text style={styles.petCardTitle}>{mascota.nombre || `Mascota ${index + 1}`}</Text>
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, {color: theme.secondaryColor}]}>Número de Chip *</Text>
                      <View style={[styles.inputWrapper, errors[`mascota_${index}`] && styles.inputError]}>
                        <MaterialIcons name="memory" size={20} color={theme.greyMedium} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputNoOutline}
                          value={mascota.chip || ''}
                          onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9]/g, '').slice(0, 15);
                            setFormData(prevData => {
                              const updatedMascotas = prevData.mascotas.map((mascotaItem, i) => {
                                if (i === index) {
                                  return {
                                    ...mascotaItem,
                                    chip: numericValue
                                  };
                                }
                                return { ...mascotaItem };
                              });
                              return {
                                ...prevData,
                                mascotas: updatedMascotas
                              };
                            });
                            if (errors[`mascota_${index}`]) {
                              setErrors(prev => ({ ...prev, [`mascota_${index}`]: null }));
                            }
                          }}
                          placeholder="Escribe 15 números"
                          keyboardType="numeric"
                          maxLength={15}
                          placeholderTextColor={theme.greyMedium}
                          autoComplete="off"
                          autoCorrect={false}
                          editable={true}
                          selectTextOnFocus={false}
                        />
                      </View>
                      {errors[`mascota_${index}`] && (
                        <Text style={styles.errorText}>{errors[`mascota_${index}`]}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </FadeInSection>

              <FadeInSection animationKey="submit-button" style={styles.submitButtonContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={theme.white} size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Continuar al Pago</Text>
                        <MaterialIcons name="arrow-forward" size={24} color={theme.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </FadeInSection>

              <FadeInSection animationKey="back-button" style={styles.backButtonContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      console.log("[DatosCompletos] Navegando a presupuestoFinal");
                      console.log("[DatosCompletos] Parámetros actuales para volver:", params);
                      
                      const backParams = {
                        animals: params.animals,
                        ownerData: params.ownerData,
                        howHeard: params.howHeard || "",
                        selectedPlanId: params.selectedPlanId,
                        planNombre: params.planNombre,
                        precioEstimado: params.precioEstimado,
                        numeroMascotas: params.numeroMascotas,
                        fromDatosCompletos: 'true'
                      };
                      
                      console.log("[DatosCompletos] Navegando con parámetros:", backParams);
                      
                      router.push({
                        pathname: '/presupuestoFinal',
                        params: backParams
                      });
                    }}
                  >
                    <MaterialIcons name="arrow-back" size={24} color={theme.white} />
                    <Text style={styles.backButtonText}>Volver Atrás</Text>
                  </TouchableOpacity>
                </Animated.View>
              </FadeInSection>
            </>
          ) : (
            <>
              <FadeInSection animationKey="resumen-header" style={[styles.headerSection, {marginBottom: spacing.large}]}> 
                <Text style={styles.pageTitle}>¡Revisa y confirma tus datos!</Text>
                <Text style={styles.pageSubtitle}>Tu información está casi lista para enviar. ¡Todo luce genial!</Text>
              </FadeInSection>

              <FadeInSection animationKey="resumen-personal" style={[styles.glassCard, styles.resumenCard, {borderLeftColor: theme.primaryColor}]}> 
                <View style={styles.resumenCardHeader}>
                  <MaterialCommunityIcons name="account-circle" size={36} color={theme.primaryColor} style={styles.cardIcon} />
                  <Text style={styles.resumenCardTitle}>Datos Personales</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>¡Tú!</Text>
                  </View>
                </View>
                <View style={styles.resumenCardBody}>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>Tipo de Documento: </Text>
                    <Text>{formData.tipoDocumento}</Text>
                  </Text>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>{formData.tipoDocumento}: </Text>
                    <Text>{formData.numeroDocumento}</Text>
                  </Text>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>Nacimiento: </Text>
                    <Text>
                      {formData.fechaNacimiento && !isNaN(new Date(formData.fechaNacimiento).getTime()) 
                        ? new Date(formData.fechaNacimiento).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) 
                        : 'No especificada'}
                    </Text>
                  </Text>
                </View>
              </FadeInSection>

              <FadeInSection animationKey="resumen-direccion" style={[styles.glassCard, styles.resumenCard, {borderLeftColor: theme.accentColor}]}> 
                <View style={styles.resumenCardHeader}>
                  <MaterialCommunityIcons name="map-marker-radius" size={36} color={theme.accentColor} style={styles.cardIcon} />
                  <Text style={styles.resumenCardTitle}>Dirección</Text>
                  <View style={[styles.badge, {backgroundColor: theme.accentColor+'33'}]}>
                    <Text style={[styles.badgeText, {color: theme.accentColor}]}>Hogar</Text>
                  </View>
                </View>
                <View style={styles.resumenCardBody}>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>Dirección: </Text>
                    <Text>
                      {tiposVia.find(t => t.value === formData.tipoVia)?.label || formData.tipoVia}
                      {formData.nombreVia ? ` ${formData.nombreVia}` : ''}
                      {formData.numero ? ` ${formData.numero}` : ''}
                      {formData.escalera ? `, Escalera ${formData.escalera}` : ''}
                      {formData.piso ? `, ${formData.piso}` : ''}
                      {formData.puerta ? `, Puerta ${formData.puerta}` : ''}
                    </Text>
                  </Text>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>Código Postal: </Text>
                    <Text>{formData.codigoPostal}</Text>
                  </Text>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>Provincia: </Text>
                    <Text>{formData.provincia || 'No especificada'}</Text>
                  </Text>
                  <Text style={styles.resumenDato}>
                    <Text style={styles.resumenLabel}>Comunidad: </Text>
                    <Text>{formData.comunidadAutonoma || 'No especificada'}</Text>
                  </Text>
                </View>
              </FadeInSection>

              <FadeInSection animationKey="resumen-mascotas" style={[styles.glassCard, styles.resumenCard, {borderLeftColor: theme.success}]}> 
                <View style={styles.resumenCardHeader}>
                  <MaterialCommunityIcons name="paw" size={36} color={theme.success} style={styles.cardIcon} />
                  <Text style={styles.resumenCardTitle}>Mascotas</Text>
                  <View style={[styles.badge, {backgroundColor: theme.success+'33'}]}>
                    <Text style={[styles.badgeText, {color: theme.success}]}>Peludos</Text>
                  </View>
                </View>
                <View style={styles.resumenCardBody}>
                  {formData.mascotas.map((m, i) => (
                    <View key={i} style={styles.petRow}>
                      <MaterialCommunityIcons name={m.tipo === 'gato' ? "cat" : "dog"} size={24} color={theme.primaryColor} style={{marginRight: 8}} />
                      <View>
                        <Text style={styles.resumenDato}>
                          <Text style={styles.resumenLabel}>Nombre: </Text>
                          <Text>{m.nombre ? m.nombre : 'Sin nombre'}</Text>
                        </Text>
                        <Text style={styles.resumenDato}>
                          <Text style={styles.resumenLabel}>Chip: </Text>
                          <Text>{m.chip ? m.chip : 'Sin chip'}</Text>
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </FadeInSection>

              {formData.planSeleccionado && (
                <FadeInSection animationKey="resumen-plan" style={[styles.glassCard, styles.resumenCard, {borderLeftColor: theme.secondaryColor}]}> 
                  <View style={styles.resumenCardHeader}>
                    <MaterialCommunityIcons name="shield-check" size={36} color={theme.secondaryColor} style={styles.cardIcon} />
                    <Text style={styles.resumenCardTitle}>Plan Seleccionado</Text>
                    <View style={[styles.badge, {backgroundColor: theme.secondaryColor+'33'}]}>
                      <Text style={[styles.badgeText, {color: theme.secondaryColor}]}>Seguro</Text>
                    </View>
                  </View>
                  <View style={styles.resumenCardBody}>
                    <Text style={styles.resumenDato}>
                      <Text style={styles.resumenLabel}>Plan: </Text>
                      <Text>{formData.planSeleccionado?.nombre || 'No especificado'}</Text>
                    </Text>
                    <Text style={styles.resumenDato}>
                      <Text style={styles.resumenLabel}>Precio base: </Text>
                      <Text>{formData.planSeleccionado?.precio?.toFixed(2)}€/mes</Text>
                    </Text>
                  </View>
                </FadeInSection>
              )}

              <FadeInSection animationKey="resumen-civil" style={[styles.glassCard, styles.resumenCard, {borderLeftColor: theme.error}]}> 
                <View style={styles.resumenCardHeader}>
                  <MaterialCommunityIcons name="account-cash" size={36} color={theme.error} style={styles.cardIcon} />
                  <Text style={styles.resumenCardTitle}>Seguro Responsabilidad Civil</Text>
                  <View style={[styles.badge, {backgroundColor: theme.error+'33'}]}>
                    <Text style={[styles.badgeText, {color: theme.error}]}>Opcional</Text>
                  </View>
                </View>
                <View style={styles.resumenCardBody}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.resumenDato}>Añadir seguro de responsabilidad civil</Text>
                    <Switch
                      value={seguroCivil}
                      onValueChange={setSeguroCivil}
                      thumbColor={seguroCivil ? theme.primaryColor : theme.greyLight}
                      trackColor={{false: theme.greyMedium, true: theme.accentColor}}
                      style={styles.switch}
                    />
                  </View>
                  {seguroCivil && (
                    <Text style={styles.civilPriceText}>+{precioCivil.toFixed(2)}€/mes</Text>
                  )}
                </View>
              </FadeInSection>

              <FadeInSection animationKey="resumen-precio" style={[styles.glassCard, styles.resumenCard, {borderLeftColor: theme.successDarker, backgroundColor: theme.successDarker+'ee'}]}> 
                <View style={styles.resumenCardHeader}>
                  <MaterialCommunityIcons name="cash-multiple" size={36} color={theme.white} style={styles.cardIcon} />
                  <Text style={[styles.resumenCardTitle, {color: theme.white}]}>Precio Final Estimado</Text>
                  <View style={[styles.badge, {backgroundColor: theme.white+'33'}]}>
                    <Text style={[styles.badgeText, {color: theme.white}]}>Total</Text>
                  </View>
                </View>
                <View style={styles.resumenCardBody}>
                  <Text style={[styles.finalPriceText, {color: theme.white}]}>
                    {finalPrice.toFixed(2)}€/mes
                  </Text>
                </View>
              </FadeInSection>

              <TouchableOpacity 
                style={styles.resumenSubmitButton} 
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.resumenSubmitButtonText}>Confirmar y Enviar</Text>
                    <MaterialIcons name="check-circle" size={28} color={theme.white} style={styles.submitButtonIcon} />
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.resumenSubmitButton, {backgroundColor: theme.greyMedium}]} 
                onPress={() => setShowResumen(false)}
              >
                <MaterialIcons name="edit" size={24} color={theme.white} style={styles.editButtonIcon} />
                <Text style={styles.resumenSubmitButtonText}>Editar Datos</Text>
              </TouchableOpacity>

            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.offWhite,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: spacing.ultraLarge,
    width: '100%',
  },
  formContainer: {
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignSelf: 'center',
    padding: 0,
    marginVertical: spacing.medium,
    display: Platform.OS === 'web' ? 'flex' : undefined,
    alignItems: 'stretch',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.large,
    paddingHorizontal: spacing.medium,
  },
  pageTitle: {
    ...typography.heading1,
    color: theme.secondaryColor,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  pageSubtitle: {
    ...typography.body,
    fontSize: 16,
    color: theme.greyMedium,
    textAlign: 'center',
    maxWidth: 600,
  },
  sectionContainer: {
    marginBottom: spacing.large,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    paddingHorizontal: Platform.OS === 'web' ? 0 : spacing.small,
  },
  sectionTitle: {
    ...typography.heading2,
    marginLeft: spacing.medium,
  },
  cardContainer: {
    backgroundColor: theme.white,
    borderRadius: 24,
    padding: spacing.large,
    ...theme.shadow,
    width: '100%',
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: 'rgba(42,157,143,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  inputContainer: {
    marginBottom: spacing.medium,
    width: '100%',
  },
  label: {
    ...typography.body,
    marginBottom: spacing.small,
    color: theme.secondaryColor,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'left',
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
    ...theme.shadow,
  },
  inputWrapperFocused: {
    borderColor: theme.primaryColor,
  },
  inputError: {
    borderColor: theme.error,
  },
  inputIcon: {
    marginRight: spacing.small,
    color: theme.greyMedium,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.small,
    fontSize: 16,
    color: theme.dark,
    minHeight: 40,
  },
  inputNoOutline: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 16,
    color: theme.dark,
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  dateInputContainer: {
    width: '100%',
    position: 'relative',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    paddingHorizontal: spacing.medium,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
    minHeight: 50,
    ...theme.shadow,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: theme.dark,
    marginLeft: spacing.small,
  },
  docTypeRowCustom: {
    flexDirection: 'row',
    gap: spacing.medium,
    marginBottom: spacing.medium,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  docTypeButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42,157,143,0.1)',
    borderWidth: 2,
    borderColor: theme.primaryColor,
    borderRadius: theme.buttonBorderRadius,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
    ...theme.shadow,
    transition: Platform.OS === 'web' ? 'all 0.3s ease' : undefined,
  },
  docTypeButtonPillActive: {
    backgroundColor: theme.primaryColor,
    borderColor: theme.primaryColor,
    transform: Platform.OS === 'web' ? [{ scale: 1.02 }] : undefined,
  },
  docTypeButtonTextPill: {
    color: theme.primaryColor,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  docTypeButtonTextPillActive: {
    color: theme.white,
  },
  selectWrapper: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  selectCustom: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    color: theme.dark,
    paddingLeft: spacing.small,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
  },
  errorText: {
    color: theme.error,
    fontSize: 13,
    marginTop: spacing.small,
    fontWeight: '500',
  },
  petCard: {
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: spacing.large,
    marginBottom: spacing.medium,
    ...theme.shadow,
    borderWidth: 2,
    borderColor: 'rgba(42,157,143,0.1)',
    borderLeftWidth: 6,
    borderLeftColor: theme.primaryColor,
    position: 'relative',
    overflow: 'hidden',
  },
  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  petCardTitle: {
    ...typography.heading3,
    fontSize: 18,
    marginLeft: spacing.medium,
    color: theme.secondaryColor,
  },
  submitButtonContainer: {
    marginTop: spacing.large,
    alignItems: 'center',
    width: '100%',
  },
  submitButton: {
    backgroundColor: theme.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium + 4,
    paddingHorizontal: spacing.extraLarge,
    borderRadius: theme.buttonBorderRadius,
    ...theme.shadow,
    minWidth: 280,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    backgroundColor: theme.greyMedium,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  submitButtonText: {
    ...typography.button,
    fontSize: 18,
    marginRight: spacing.medium,
  },
  planInfoContainer: {
    backgroundColor: theme.mutedPrimary,
    borderRadius: theme.borderRadius,
    padding: spacing.medium,
    marginBottom: spacing.large,
    ...theme.shadow,
  },
  planInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  planInfoTitle: {
    ...typography.heading3,
    fontSize: 18,
    marginLeft: spacing.medium,
    color: theme.secondaryColor,
  },
  planInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfoLeft: {
    flex: 1,
  },
  planInfoName: {
    ...typography.heading3,
    fontSize: 18,
    color: theme.secondaryColor,
  },
  planInfoSubtitle: {
    ...typography.body,
    color: theme.greyMedium,
    fontSize: 14,
  },
  planInfoRight: {
    marginLeft: spacing.large,
  },
  planInfoPrice: {
    ...typography.heading3,
    fontSize: 18,
    color: theme.primaryColor,
  },
  resumenLabel: { fontWeight: '600', color: theme.secondaryColor, marginRight: spacing.small },
  resumenDato: { fontSize: 16, marginBottom: spacing.small / 2, color: theme.dark, flexShrink: 1 },
  finalPriceText: { ...typography.heading1, color: theme.success, textAlign: 'center', marginTop: spacing.small },
  resumenCard: {
    borderRadius: theme.borderRadius,
    marginBottom: spacing.medium,
    padding: spacing.medium,
    ...theme.shadow,
    borderWidth: 1,
    borderColor: theme.borderColor,
    backgroundColor: theme.white,
  },
  resumenCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  resumenCardTitle: {
    ...typography.heading2,
    fontSize: 20,
    marginLeft: spacing.medium,
    color: theme.secondaryColor,
  },
  resumenCardBody: {
    paddingLeft: Platform.OS === 'web' ? (spacing.small + 36) : spacing.small,
  },
  resumenSubmitButton: {
    backgroundColor: theme.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    borderRadius: theme.buttonBorderRadius,
    marginTop: spacing.large,
    ...theme.shadow,
    minWidth: 280,
  },
  resumenSubmitButtonText: {
    ...typography.button,
    fontSize: 18,
    color: theme.white,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    borderLeftWidth: 6,
    marginBottom: spacing.medium,
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: 'rgba(224, 224, 224, 0.5)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardIcon: {
    marginRight: spacing.medium,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: theme.primaryColor+'20',
    borderRadius: 8,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small / 2,
    alignSelf: 'center',
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 12,
    color: theme.primaryColor,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
    backgroundColor: theme.offWhite,
    borderRadius: 8,
    padding: spacing.small,
    marginTop: spacing.small / 2,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.greyMedium,
    paddingVertical: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    backgroundColor: theme.greyLight,
  },
  direccionSection: {
    backgroundColor: 'rgba(42,157,143,0.05)',
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    marginBottom: spacing.medium,
    borderWidth: 2,
    borderColor: 'rgba(42,157,143,0.2)',
    borderStyle: 'dashed',
    position: 'relative',
  },
  direccionSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
    textAlign: 'center',
    color: theme.primaryColor,
    backgroundColor: theme.white,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 20,
    alignSelf: 'center',
    ...theme.shadow,
  },
  direccionRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.medium,
    marginBottom: spacing.medium,
  },
  direccionRowItem: {
    flex: Platform.OS === 'web' ? 1 : undefined,
    marginBottom: Platform.OS === 'web' ? 0 : spacing.small,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'linear-gradient(90deg, transparent, rgba(42,157,143,0.3), transparent)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  inputFocused: {
    borderColor: theme.primaryColor,
    borderWidth: 2,
    transform: Platform.OS === 'web' ? [{ scale: 1.01 }] : undefined,
  },
  sectionHeaderAnimated: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    paddingHorizontal: spacing.extraLarge,
    backgroundColor: 'rgba(42,157,143,0.05)',
    paddingVertical: spacing.medium,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.primaryColor,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: -1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(42,157,143,0.3)',
    top: '50%',
  },
  petCountBadge: {
    backgroundColor: theme.primaryColor,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 'auto',
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCountText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButtonContainer: {
    marginTop: spacing.medium,
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: theme.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium + 4,
    paddingHorizontal: spacing.extraLarge,
    borderRadius: theme.buttonBorderRadius,
    ...theme.shadow,
    minWidth: 280,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.white,
    marginLeft: spacing.small,
  },
  noAnimalsContainer: {
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: spacing.large,
    marginBottom: spacing.medium,
    borderWidth: 2,
    borderColor: theme.error,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  noAnimalsText: {
    fontSize: 16,
    color: theme.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  switch: {
    marginLeft: spacing.medium,
  },
  civilPriceText: {
    color: theme.error,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  submitButtonIcon: {
    marginLeft: spacing.medium,
  },
  editButtonIcon: {
    marginRight: spacing.medium,
  },
});

