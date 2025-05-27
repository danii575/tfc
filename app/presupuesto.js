// app/presupuesto.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Alert,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from 'firebase/auth'; 
import { db, app as firebaseApp } from '../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

import Header from '../components/Header'; 
import { useAuth } from './_layout'; // Asegúrate que esta ruta sea correcta para tu AuthContext
import dogBreeds from './dogBreeds.json';

// --- Definiciones de Tema y Estilo ---
const theme = {
  primaryColor: '#2A9D8F',
  secondaryColor: '#264653',
  mutedPrimary: '#A8DADC',
  offWhite: '#FAF7F2', 
  success: '#28a745',
  error: '#E76F51',
  white: '#FFFFFF',
  greyLight: '#E9ECEF',
  dark: '#343a40',
  greyMedium: '#B0BEC5', 
  borderRadius: 12,
  shadow: Platform.select({ 
    ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 5 },
    android: { elevation: 4 },
    web: { boxShadow: '0 4px 8px rgba(0,0,0,0.08)' },
  }),
  hoverShadow: Platform.OS === 'web' ? { boxShadow: "0 6px 14px rgba(0,0,0,0.12)" } : {},
};

const typography = {
  heading2: { fontSize: Platform.OS === 'web' ? 28 : 24, fontWeight: 'bold', color: theme.secondaryColor, textAlign: 'center' },
  heading3: { fontSize: Platform.OS === 'web' ? 20 : 18, fontWeight: '600', color: theme.secondaryColor, textAlign: 'left' },
  body: { fontSize: 16, color: theme.dark, lineHeight: 24 },
  button: { fontSize: 16, fontWeight: '600', color: theme.white, textAlign: 'center' },
};

const spacing = { small: 8, medium: 14, large: 20, extraLarge: 28 };
// --- Fin Tema ---

// --- Componentes Reutilizables ---
const HoverView = ({ children, style, hoverStyle, scale = 1.01 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleMouseEnter = () => { if (Platform.OS === 'web') { setIsHovered(true); Animated.spring(scaleAnim, { toValue: scale, friction: 5, useNativeDriver: false }).start(); }};
  const handleMouseLeave = () => { if (Platform.OS === 'web') { setIsHovered(false); Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: false }).start(); }};
  const animatedStyle = Platform.OS === 'web' ? { transform: [{ scale: scaleAnim }] } : {};
  const combinedStyle = [style, animatedStyle, isHovered && hoverStyle];
  if (Platform.OS === 'web') { 
    return (<Animated.View 
        // @ts-ignore
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={combinedStyle}>{children}</Animated.View>); 
    }
  return <View style={style}>{children}</View>;
};

const ProgressBar = ({ current, total }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const widthAnimated = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(widthAnimated, { toValue: Math.max(0, Math.min(100, progress)), duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: false, }).start(); }, [progress]);
  const width = widthAnimated.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (<View style={styles.progressBarContainer}><Animated.View style={[styles.progressBarFill, { width }]} /></View>);
};

const FormPicker = ({ label, selectedValue, onValueChange, options, placeholder, enabled = true, isOptional = false, errorText }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>
      {label}
      {!isOptional && <Text style={{color: theme.error}}>*</Text>}
    </Text>
    <View style={[styles.pickerInputContainer, !enabled && styles.pickerDisabledContainer, errorText ? styles.inputErrorBorder : {}]}>
      <Picker 
        selectedValue={selectedValue} 
        onValueChange={onValueChange} 
        enabled={enabled} 
        style={styles.pickerElement} 
        dropdownIconColor={theme.primaryColor} 
        mode="dropdown"
      >
        <Picker.Item 
          label={placeholder || "Seleccionar..."} 
          value="" 
          style={styles.pickerPlaceholderItem} 
        />
        {options.map((option, index) => (
          <Picker.Item 
            key={`${option.value}-${index}`}
            label={option.label} 
            value={option.value} 
            style={styles.pickerItem} 
          />
        ))}
      </Picker>
    </View>
    {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
  </View>
);

const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, multiline, numberOfLines, isOptional, errorText, editable = true }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}{!isOptional && <Text style={{color: theme.error}}>*</Text>}</Text>
    <TextInput
      style={[ styles.input, multiline && styles.multilineInput, !editable && styles.inputDisabled, errorText ? styles.inputErrorBorder : {} ]}
      value={value} onChangeText={onChangeText} placeholder={placeholder || `Ingrese ${label.toLowerCase().replace(' *','')}`}
      placeholderTextColor={theme.greyMedium} keyboardType={keyboardType || 'default'} multiline={multiline || false} numberOfLines={numberOfLines || 1}
      editable={editable}
    />
    {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
  </View>
);

const FadeInSection = ({ children, duration = 350, style, animationKey }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    fadeAnim.setValue(0); translateY.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [animationKey, duration, fadeAnim, translateY]);
  return <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, styles.fadeInViewBase, style]}>{children}</Animated.View>;
};

const FormCard = ({ title, children, style }) => (
  <HoverView style={[styles.cardBase, theme.shadow, style]} hoverStyle={theme.hoverShadow} scale={1.01}>
    {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
    {children}
  </HoverView>
);

const FormButton = ({ title, onPress, style, textStyle, iconName, iconSet = "MaterialIcons", variant = 'primary', disabled = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleMouseEnter = () => { 
    if (Platform.OS === 'web' && !disabled) { 
      setIsHovered(true); 
      Animated.parallel([
        Animated.spring(scaleAnim, { 
          toValue: 1.05, 
          friction: 4, 
          useNativeDriver: true 
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const handleMouseLeave = () => { 
    if (Platform.OS === 'web' && !disabled) { 
      setIsHovered(false); 
      Animated.parallel([
        Animated.spring(scaleAnim, { 
          toValue: 1, 
          friction: 5, 
          useNativeDriver: true 
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const pressInAnim = () => { 
    if(!disabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, { 
          toValue: 0.95, 
          friction: 4, 
          useNativeDriver: true 
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const pressOutAnim = () => { 
    if(!disabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, { 
          toValue: isHovered && Platform.OS === 'web' ? 1.05 : 1, 
          friction: 5, 
          useNativeDriver: true 
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  };
  
  const buttonActualStyles = [styles.button]; 
  const buttonTextStyles = [styles.buttonText];
  let iconColor = disabled ? theme.greyMedium : (variant === 'secondary' ? theme.primaryColor : theme.white);
  
  if (variant === 'secondary') { 
    buttonActualStyles.push(styles.buttonSecondary); 
    buttonTextStyles.push(styles.buttonTextSecondary); 
  } else { 
    buttonActualStyles.push(styles.buttonPrimary); 
  }
  
  if (disabled) buttonActualStyles.push(styles.buttonDisabled);
  
  const IconComponent = iconSet === "Ionicons" ? Ionicons : MaterialIcons;
  
  return (
    <Animated.View style={[
      { 
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim
      }
    ]}>
      <TouchableOpacity 
        style={[buttonActualStyles, style]} 
        onPress={onPress} 
        disabled={disabled} 
        activeOpacity={0.8} 
        onPressIn={pressInAnim} 
        onPressOut={pressOutAnim} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
      >
      {iconName && <IconComponent name={iconName} size={20} color={iconColor} style={{ marginRight: spacing.small }} />} 
      <Text style={[buttonTextStyles, textStyle, disabled && styles.buttonTextDisabled]}>{title}</Text> 
    </TouchableOpacity> 
    </Animated.View>
  );
};

// Componente para selector filtrable de razas con icono de búsqueda
const FilterablePicker = ({ label, selectedValue, onValueChange, options, placeholder, errorText }) => {
  const [filter, setFilter] = useState('');
  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.searchBarContainer}>
        <MaterialIcons name="search" size={20} color={theme.greyMedium} style={{ marginRight: 6 }} />
        <TextInput
          style={[
            styles.input,
            { flex: 1, borderWidth: 0, minHeight: 40, marginBottom: 0, paddingLeft: 0 },
            errorText ? styles.inputErrorBorder : {}
          ]}
          value={filter}
          onChangeText={setFilter}
          placeholder={placeholder || 'Buscar raza...'}
          placeholderTextColor={theme.greyMedium}
        />
      </View>
      <View style={[styles.pickerInputContainer, errorText ? styles.inputErrorBorder : {}]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.pickerElement}
          dropdownIconColor={theme.primaryColor}
          mode="dropdown"
        >
          <Picker.Item label={placeholder || 'Seleccionar...'} value="" style={styles.pickerPlaceholderItem} />
          {filteredOptions.map((raza, idx) => (
            <Picker.Item key={raza + idx} label={raza} value={raza} style={styles.pickerItem} />
          ))}
        </Picker>
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const DropdownRaza = ({ label, value, onChange, options, errorText, placeholder }) => {
  const [input, setInput] = useState('');
  const [showList, setShowList] = useState(false);

  // Filtrado flexible
  const filtered = options.filter(
    r => input.length === 0 || r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .includes(input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );

  const handleSelect = (raza) => {
    setInput('');
    setShowList(false);
    onChange(raza);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.input, errorText ? styles.inputErrorBorder : {}, { flexDirection: 'row', alignItems: 'center', position: 'relative' }]}
        onPress={() => setShowList(!showList)}
      >
        <Text style={{ color: value ? theme.dark : theme.greyMedium, flex: 1 }}>
          {value || placeholder || 'Buscar raza...'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={theme.greyMedium} />
      </TouchableOpacity>
      {showList && (
        <View style={styles.dropdownList}>
          <View style={styles.dropdownSearchRow}>
            <MaterialIcons name="search" size={20} color={theme.greyMedium} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.dropdownSearchInput}
              value={input}
              onChangeText={setInput}
              placeholder="Buscar raza..."
              placeholderTextColor={theme.greyMedium}
              autoFocus
            />
          </View>
          <ScrollView style={{ maxHeight: 180 }}>
            {filtered.length === 0 && (
              <Text style={styles.dropdownNoResult}>No hay resultados</Text>
            )}
            {filtered.map((raza, idx) => (
              <TouchableOpacity
                key={raza + idx}
                onPress={() => handleSelect(raza)}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText}>{raza}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const AutocompleteRaza = ({ label, value, onChange, options, errorText, placeholder }) => {
  const [input, setInput] = useState(value || '');
  const [showList, setShowList] = useState(false);

  // Filtrado flexible: incluye si contiene el texto, sin importar mayúsculas/minúsculas
  const filtered = options.filter(
    r => input.length === 0 || r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .includes(input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );

  const handleSelect = (raza) => {
    setInput(raza);
    setShowList(false);
    onChange(raza);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={{position: 'relative', width: '100%'}}>
        <TextInput
          style={[styles.input, errorText ? styles.inputErrorBorder : {}]}
          value={input}
          onChangeText={text => {
            setInput(text);
            setShowList(true);
            onChange(''); // Limpia el valor real hasta que seleccione
          }}
          placeholder={placeholder || 'Buscar raza...'}
          placeholderTextColor={theme.greyMedium}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 150)} // Da tiempo a hacer click en la sugerencia
        />
        {showList && filtered.length > 0 && (
          <View style={styles.autocompleteListFixed}>
            {filtered.slice(0, 10).map((raza, idx) => (
              <TouchableOpacity
                key={raza + idx}
                onPress={() => handleSelect(raza)}
                style={styles.autocompleteItem}
              >
                <Text style={styles.autocompleteText}>{raza}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

const RAZA_OTRA = 'Otro';

const RazaPicker = ({ label, selectedValue, onValueChange, options, errorText, placeholder, customValue, onCustomChange, mezcla1, mezcla2, onMezcla1Change, onMezcla2Change, showMezclaPickers }) => {
  const filteredOptions = options.filter(r => r !== 'Mezcla' && r !== 'Otra raza o mezcla...');
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.pickerInputContainer, errorText ? styles.inputErrorBorder : {}]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={value => {
            if (value === RAZA_OTRA) {
              onValueChange(RAZA_OTRA);
            } else {
              onValueChange(value);
            }
          }}
          style={styles.pickerElement}
          dropdownIconColor={theme.primaryColor}
          mode="dropdown"
        >
          <Picker.Item label={placeholder || 'Seleccionar...'} value="" style={styles.pickerPlaceholderItem} />
          {options.map((raza, idx) => (
            <Picker.Item key={raza + idx} label={raza} value={raza} style={styles.pickerItem} />
          ))}
          <Picker.Item label="Otra raza o mezcla..." value={RAZA_OTRA} style={styles.pickerItem} />
        </Picker>
      </View>
      {selectedValue === RAZA_OTRA && (
        <View>
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={customValue || ''}
            onChangeText={onCustomChange}
            placeholder="Escribe la raza o mezcla... (opcional)"
            placeholderTextColor={theme.greyMedium}
          />
          {showMezclaPickers && (
            <View>
              <View style={{marginTop: 12}}>
                <Text style={styles.inputLabel}>Raza 1</Text>
                <View style={styles.pickerInputContainer}>
                  <Picker
                    selectedValue={mezcla1}
                    onValueChange={onMezcla1Change}
                    style={styles.pickerElement}
                    dropdownIconColor={theme.primaryColor}
                    mode="dropdown"
                  >
                    <Picker.Item label="Seleccionar raza 1..." value="" style={styles.pickerPlaceholderItem} />
                    {filteredOptions.map((raza, idx) => (
                      <Picker.Item key={raza + idx} label={raza} value={raza} style={styles.pickerItem} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={{marginTop: 12}}>
                <Text style={styles.inputLabel}>Raza 2</Text>
                <View style={styles.pickerInputContainer}>
                  <Picker
                    selectedValue={mezcla2}
                    onValueChange={onMezcla2Change}
                    style={styles.pickerElement}
                    dropdownIconColor={theme.primaryColor}
                    mode="dropdown"
                  >
                    <Picker.Item label="Seleccionar raza 2..." value="" style={styles.pickerPlaceholderItem} />
                    {filteredOptions.map((raza, idx) => (
                      <Picker.Item key={raza + idx} label={raza} value={raza} style={styles.pickerItem} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

// Campo de raza para perros: Picker personalizado con buscador integrado en el propio desplegable, que se comporta igual que el resto de los selectores pero con un input de búsqueda en la parte superior del menú. El usuario puede escribir en el buscador y la lista de razas se filtra en tiempo real. El menú se muestra sobre el resto del contenido, igual que un select nativo. El valor seleccionado se muestra en el campo. El buscador solo aparece si el tipo es 'perro'.
const RazaPickerConBuscador = ({ label, selectedValue, onValueChange, options, errorText, placeholder }) => {
  // Asegurarnos de que options sea un array y tenga el formato correcto
  const safeOptions = Array.isArray(options) ? options : [];
  
  // Convertir las opciones al formato requerido por FormPicker
  const formattedOptions = safeOptions.map(raza => ({
    label: String(raza),
    value: String(raza)
  }));

  return (
    <FormPicker
      label={label}
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      options={formattedOptions}
      placeholder={placeholder}
      errorText={errorText}
    />
  );
};

// --- Estados y Opciones ---
const initialAnimalState = { nombre: '', tipo: '', tipoExotico: '', sexo: '', edad: '', raza: '', enfermedadesAnteriores: '', notasAdicionales: '' };
const initialAnimalErrorsState = { nombre: null, tipo: null, tipoExotico: null, sexo: null, edad: null, raza: null };
const initialOwnerState = { 
  nombre: '', 
  primerApellido: '', 
  segundoApellido: '', 
  email: '', 
  telefono: '' 
};
const initialOwnerErrorsState = { 
  nombre: null, 
  primerApellido: null, 
  segundoApellido: null, 
  email: null, 
  telefono: null 
};
const sexoOptions = [{ label: 'Macho', value: 'macho' }, { label: 'Hembra', value: 'hembra' }];
const tipoAnimalOptions = [{ label: 'Perro', value: 'perro' }, { label: 'Gato', value: 'gato' }, { label: 'Otro', value: 'otro' }];
const edadAnimalOptions = [ { label: 'Cachorro (0-1 año)', value: 'cachorro_0_1' }, { label: 'Joven (1-3 años)', value: 'joven_1_3' }, { label: 'Adulto (3-7 años)', value: 'adulto_3_7' }, { label: 'Adulto Mayor (7-10 años)', value: 'adulto_mayor_7_10' }, { label: 'Senior (10+ años)', value: 'senior_10_plus' }];
const tipoExoticoOptions = [ { label: 'Conejo', value: 'conejo' }, { label: 'Hurón', value: 'huron' }, { label: 'Cobaya', value: 'cobaya' }, { label: 'Hámster', value: 'hamster' }, { label: 'Chinchilla', value: 'chinchilla' }, { label: 'Pájaro', value: 'pajaro' }, { label: 'Reptil', value: 'reptil' }, { label: 'Otro Exótico', value: 'otro_exotico_domestico' }];
// --- Fin Estados y Opciones ---

// Nuevos componentes para la selección inicial
const AnimalTypeCard = ({ type, icon, title, onSelect, isSelected }) => (
  <TouchableOpacity 
    onPress={() => onSelect(type)}
    style={[
      styles.animalTypeCard,
      isSelected && styles.animalTypeCardSelected
    ]}
  >
    <MaterialIcons name={icon} size={48} color={isSelected ? theme.white : theme.primaryColor} />
    <Text style={[
      styles.animalTypeTitle,
      isSelected && styles.animalTypeTitleSelected
    ]}>{title}</Text>
  </TouchableOpacity>
);

export default function PresupuestoPage() {
  const router = useRouter();
  const { currentUser, userData: authUserData } = useAuth(); 

  const [currentStep, setCurrentStep] = useState(0); 
  const [animals, setAnimals] = useState([{ ...initialAnimalState }]);
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);
  const [currentAnimalErrors, setCurrentAnimalErrors] = useState({ ...initialAnimalErrorsState });
  
  const [ownerData, setOwnerData] = useState({ ...initialOwnerState });
  const [ownerErrors, setOwnerErrors] = useState({ ...initialOwnerErrorsState });
  
  const [howHeard, setHowHeard] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const [customRaza, setCustomRaza] = useState('');
  const [mezcla1, setMezcla1] = useState('');
  const [mezcla2, setMezcla2] = useState('');

  useEffect(() => {
    if (currentUser) { 
      console.log("[PresupuestoPage] Usuario logueado detectado, pre-rellenando datos del dueño:", authUserData, currentUser);
      const nombreCompleto = authUserData?.nombreCompleto || authUserData?.nombre || currentUser?.displayName || '';
      const partes = nombreCompleto.split(' ');
      setOwnerData(prev => ({
        ...prev,
        nombre: partes[0] || '',
        primerApellido: partes[1] || '',
        segundoApellido: partes[2] || '',
        email: currentUser?.email || '',
      }));
    } else {
      console.log("[PresupuestoPage] No hay usuario logueado, usando datos iniciales para dueño.");
      setOwnerData({...initialOwnerState});
    }
  }, [currentUser, authUserData]);


  const handleNavigateDummy = () => { console.log("Navegación dummy desde Header");};

  const handleAnimalChange = (field, value) => {
    const updatedAnimals = animals.map((animal, index) => {
      if (index === currentAnimalIndex) {
        const updatedAnimal = { ...animal, [field]: value };
        if (field === 'tipo' && value !== 'otro') updatedAnimal.tipoExotico = '';
        return updatedAnimal;
      }
      return animal;
    });
    setAnimals(updatedAnimals);
    if (currentAnimalErrors[field]) {
      setCurrentAnimalErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOwnerChange = (field, value) => {
    setOwnerData(prev => ({ ...prev, [field]: value }));
    if (ownerErrors[field]) {
      setOwnerErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateAnimalFields = (animalIndex, showAlertOnError = false) => {
    const animalToValidate = animals[animalIndex];
    let errors = { ...initialAnimalErrorsState }; 
    let isValid = true;
    if (!animalToValidate.nombre.trim()) { errors.nombre = "Nombre es obligatorio."; isValid = false; }
    if (!animalToValidate.tipo) { errors.tipo = "Tipo es obligatorio."; isValid = false; }
    if (animalToValidate.tipo === 'otro' && !animalToValidate.tipoExotico) { errors.tipoExotico = "Especifique tipo exótico."; isValid = false; }
    if (!animalToValidate.sexo) { errors.sexo = "Sexo es obligatorio."; isValid = false; }
    if (!animalToValidate.edad) { errors.edad = "Rango de edad es obligatorio."; isValid = false; }
    if (!animalToValidate.raza.trim()) { errors.raza = "Raza es obligatoria."; isValid = false; }
    
    setCurrentAnimalErrors(errors);
    if (!isValid && showAlertOnError) {
        Alert.alert(`Datos Incompletos (Animal ${animalIndex + 1})`, 'Por favor, corrija los campos marcados.');
    }
    return isValid;
  };

  const validateOwnerFields = (showAlertOnError = false) => {
    let errors = { ...initialOwnerErrorsState }; 
    let isValid = true;
    if (!ownerData.nombre.trim()) { errors.nombre = "Nombre es obligatorio."; isValid = false; }
    if (!ownerData.primerApellido.trim()) { errors.primerApellido = "Primer apellido es obligatorio."; isValid = false; }
    if (!ownerData.segundoApellido.trim()) { errors.segundoApellido = "Segundo apellido es obligatorio."; isValid = false; }
    if (!ownerData.email.trim()) { errors.email = "Email es obligatorio."; isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(ownerData.email)) { errors.email = "Formato de email no válido."; isValid = false; }
    if (!ownerData.telefono.trim()) { errors.telefono = "Teléfono es obligatorio."; isValid = false; }
    else {
      const phoneDigits = ownerData.telefono.replace(/\D/g, '');
      if (phoneDigits.length < 9 || phoneDigits.length > 15) { errors.telefono = "Teléfono debe tener entre 9 y 15 dígitos."; isValid = false; }
      else if (!/^\+?[0-9\s-]{9,15}$/.test(ownerData.telefono)) { errors.telefono = "Formato de teléfono no válido."; isValid = false; }
    }
    setOwnerErrors(errors);
    if (!isValid && showAlertOnError) {
        Alert.alert('Errores en Datos del Dueño', 'Por favor, corrija los campos marcados.');
    }
    return isValid;
  };
  
  const scrollToTop = () => scrollViewRef.current?.scrollTo({ y: 0, animated: true });

  const resetAllErrorStates = () => {
      setCurrentAnimalErrors({...initialAnimalErrorsState});
      setOwnerErrors({...initialOwnerErrorsState});
  };

  const navigateToEdit = (stepToEdit, animalIdx = null) => {
    resetAllErrorStates();
    if (animalIdx !== null) setCurrentAnimalIndex(animalIdx);
    setCurrentStep(stepToEdit);
    scrollToTop();
  };
  
  const nextStepAction = () => {
    if (currentStep === 0) {
      if (!currentAnimalData.tipo) {
        Alert.alert('Selección Requerida', 'Por favor, selecciona el tipo de animal.');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!validateAnimalFields(currentAnimalIndex, true)) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateOwnerFields(true)) {
        return;
      }
      setCurrentStep(4);
    }
    scrollToTop();
  };

  const prevStepAction = () => {
    if (currentStep === 1) setCurrentStep(0);
    else if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 4) setCurrentStep(3);
    else if (currentStep === 0 && router.canGoBack()) router.back();
    scrollToTop();
  };

  const addAnotherAnimalAction = () => {
    if (!validateAnimalFields(currentAnimalIndex, true)) { scrollToTop(); return; }
    resetAllErrorStates(); 
    setAnimals(prev => [...prev, { ...initialAnimalState }]);
    setCurrentAnimalIndex(prev => prev + 1);
    setCurrentStep(0);
    scrollToTop();
  };

  const proceedToOwnerAction = () => {
    if (!validateAnimalFields(currentAnimalIndex, true)) { scrollToTop(); return; }
    resetAllErrorStates();
    setCurrentStep(1);
    scrollToTop();
  };

  const handleSubmit = async () => {
    console.log("[handleSubmit] Botón presionado. isLoading:", isLoading);
    if (isLoading) { console.log("[handleSubmit] Ya se está procesando una solicitud."); return; }

    console.log("[handleSubmit] Iniciando validaciones...");
    resetAllErrorStates(); 

    for (let i = 0; i < animals.length; i++) {
      if (!validateAnimalFields(i, true)) { 
        console.log(`[handleSubmit] Validación fallida para animal ${i + 1}.`);
        setCurrentStep(0); setCurrentAnimalIndex(i); scrollToTop(); return; 
      }
    }
    console.log("[handleSubmit] Validación de animales PASADA.");

    if (!validateOwnerFields(true)) { 
      console.log("[handleSubmit] Validación fallida para datos del dueño.");
      setCurrentStep(1); scrollToTop(); return; 
    }
    console.log("[handleSubmit] Validación de dueño PASADA.");

    const auth = getAuth(firebaseApp); 
    const firebaseAuthCurrentUser = auth.currentUser; 

    const navigateToFinalScreen = (paramsForNextScreen) => {
        console.log("[navigateToFinalScreen] Navegando a /presupuestoFinal con params:", paramsForNextScreen);
        try {
            router.push({ 
                pathname: '/presupuestoFinal', 
                params: paramsForNextScreen
            });
            console.log("[navigateToFinalScreen] Navegación DESPACHADA.");
        } catch (e) {
            console.error("[navigateToFinalScreen] ERROR al navegar:", e);
            Alert.alert("Error de Navegación", "No se pudo ir a la pantalla de opciones: " + e.message);
            if(firebaseAuthCurrentUser) setIsLoading(false); // Solo si era un intento de guardado
        }
    };

    if (firebaseAuthCurrentUser) { 
      console.log("[handleSubmit] Usuario AUTENTICADO:", firebaseAuthCurrentUser.uid);
      setIsLoading(true);
      try {
        const budgetData = { 
          uidUsuario: firebaseAuthCurrentUser.uid, animals, ownerData, 
          howHeard: howHeard.trim(), status: "solicitado",
          createdAt: new Date().toISOString() 
        };
        console.log("[handleSubmit] Datos a guardar (logueado):", JSON.stringify(budgetData, null, 2));
        const docRef = await addDoc(collection(db, 'presupuestos'), budgetData);
        console.log("[handleSubmit] Datos GUARDADOS en Firebase. ID:", docRef.id);
        
        // Navegar PRIMERO, LUEGO mostrar alerta.
        navigateToFinalScreen({ 
            animals: JSON.stringify(animals), 
            ownerData: JSON.stringify(ownerData),
            howHeard: howHeard.trim(), 
            uidUsuario: firebaseAuthCurrentUser.uid, 
        });
        
        // Poner isLoading a false DESPUÉS de intentar la navegación.
        // La alerta se mostrará si la navegación no interrumpe el flujo.
        // Si el error "Unexpected text node" ocurre aquí, la alerta podría no mostrarse.
        setTimeout(() => {
            setIsLoading(false); 
            console.log("[handleSubmit] isLoading puesto a false (logueado, después de guardar y retraso de alerta).");
            Alert.alert('Solicitud Guardada', 'Tus datos han sido guardados y te hemos redirigido para ver las opciones.');
        }, 150); // Pequeña demora para la alerta


      } catch (error) { 
        setIsLoading(false); 
        console.error("[handleSubmit] ERROR al guardar (logueado): ", error.code, error.message); 
        Alert.alert( 'Error al Guardar', 'No se pudo guardar tu solicitud. Detalles: ' + error.message );
      }
    } else { 
      console.log("[handleSubmit] Usuario INVITADO.");
      setIsLoading(false); 
      navigateToFinalScreen({ 
        animals: JSON.stringify(animals), 
        ownerData: JSON.stringify(ownerData), 
        howHeard: howHeard.trim(),
        isGuest: "true" 
      });
      setTimeout(() => {
        Alert.alert(
            'Continuar como Invitado',
            'Te mostraremos un resumen de tu presupuesto. Para guardarlo o contratar, necesitarás iniciar sesión o registrarte más adelante.'
        );
      }, 150);
    }
    console.log("[handleSubmit] Proceso finalizado.");
  };
  
  const currentAnimalData = animals[currentAnimalIndex] || initialAnimalState;
  const animationKey = `s${currentStep}-a${currentAnimalIndex}`;
  
  const totalUserSteps = 3; 
  let currentDisplayStep = 0;
  if (currentStep === 0 || currentStep === 0.5) currentDisplayStep = 1;
  else if (currentStep === 1) currentDisplayStep = 2;
  else if (currentStep === 2) currentDisplayStep = 3;
  else if (currentStep === 3) currentDisplayStep = 4;

  // --- RENDER FUNCTIONS ---
  const renderAnimalTypeSelection = () => (
    <FadeInSection animationKey="animal-type-selection">
      <FormCard title="Selecciona el tipo de animal">
        <View style={styles.animalTypeContainer}>
          <AnimalTypeCard
            type="perro"
            icon="pets"
            title="Perro"
            onSelect={(type) => handleAnimalChange('tipo', type)}
            isSelected={currentAnimalData.tipo === 'perro'}
          />
          <AnimalTypeCard
            type="gato"
            icon="pets"
            title="Gato"
            onSelect={(type) => handleAnimalChange('tipo', type)}
            isSelected={currentAnimalData.tipo === 'gato'}
          />
          <AnimalTypeCard
            type="otro"
            icon="pets"
            title="Otro"
            onSelect={(type) => handleAnimalChange('tipo', type)}
            isSelected={currentAnimalData.tipo === 'otro'}
          />
        </View>
      </FormCard>
          </FadeInSection>
  );

  const renderBasicAnimalForm = () => (
    <FadeInSection animationKey="basic-animal-form">
      <FormCard title="Datos Básicos del Animal">
        <FormInput
          label="Nombre del Animal"
          value={currentAnimalData.nombre}
          onChangeText={text => handleAnimalChange('nombre', text)}
          errorText={currentAnimalErrors.nombre}
        />
        <FormPicker
          label="Sexo"
          selectedValue={currentAnimalData.sexo}
          onValueChange={value => handleAnimalChange('sexo', value)}
          options={sexoOptions}
          errorText={currentAnimalErrors.sexo}
        />
        <FormPicker
          label="Rango de Edad"
          selectedValue={currentAnimalData.edad}
          onValueChange={value => handleAnimalChange('edad', value)}
          options={edadAnimalOptions}
          errorText={currentAnimalErrors.edad}
        />
        {currentAnimalData.tipo === 'perro' && (
          <RazaPickerConBuscador
            label="Raza"
            selectedValue={currentAnimalData.raza}
            onValueChange={value => handleAnimalChange('raza', value)}
            options={dogBreeds}
            errorText={currentAnimalErrors.raza}
            placeholder="Seleccionar raza..."
          />
        )}
        {currentAnimalData.tipo === 'otro' && (
          <FormPicker
            label="Tipo de Animal Exótico"
            selectedValue={currentAnimalData.tipoExotico}
            onValueChange={value => handleAnimalChange('tipoExotico', value)}
            options={tipoExoticoOptions}
            errorText={currentAnimalErrors.tipoExotico}
          />
        )}
      </FormCard>
    </FadeInSection>
  );

  const renderAdditionalInfoForm = () => (
    <FadeInSection animationKey="additional-info-form">
      <FormCard title="Información Adicional">
        <FormInput
          label="Enfermedades Anteriores"
          isOptional={true}
          value={currentAnimalData.enfermedadesAnteriores}
          onChangeText={text => handleAnimalChange('enfermedadesAnteriores', text)}
          multiline
          numberOfLines={3}
          placeholder="Describa brevemente..."
        />
        <FormInput
          label="Notas Adicionales"
          isOptional={true}
          value={currentAnimalData.notasAdicionales}
          onChangeText={text => handleAnimalChange('notasAdicionales', text)}
          multiline
          numberOfLines={3}
          placeholder="Alergias, comportamiento, dieta..."
        />
        </FormCard>
    </FadeInSection>
  );

  const renderOwnerForm = () => (
    <FadeInSection animationKey="owner-form">
      <FormCard title="Datos del Dueño">
        <FormInput 
          label="Nombre" 
          value={ownerData.nombre} 
          onChangeText={text => handleOwnerChange('nombre', text)} 
          errorText={ownerErrors.nombre} 
          editable={!currentUser} 
        />
        <FormInput 
          label="Primer Apellido" 
          value={ownerData.primerApellido} 
          onChangeText={text => handleOwnerChange('primerApellido', text)} 
          errorText={ownerErrors.primerApellido} 
          editable={!currentUser} 
        />
        <FormInput 
          label="Segundo Apellido" 
          value={ownerData.segundoApellido} 
          onChangeText={text => handleOwnerChange('segundoApellido', text)} 
          errorText={ownerErrors.segundoApellido} 
          editable={!currentUser} 
        />
        <FormInput 
          label="Email" 
          value={ownerData.email} 
          onChangeText={text => handleOwnerChange('email', text)} 
          keyboardType="email-address" 
          errorText={ownerErrors.email}
          editable={!currentUser} 
        />
        <FormInput 
          label="Teléfono" 
          value={ownerData.telefono} 
          onChangeText={text => handleOwnerChange('telefono', text)} 
          keyboardType="phone-pad" 
          placeholder="Ej: 600112233" 
          errorText={ownerErrors.telefono}
        />
      </FormCard>
    </FadeInSection>
  );

  const renderDiscoveryForm = () => (
    <FadeInSection animationKey="discovery-form">
      <FormCard title="Un Poco Más Sobre Ti">
        <FormInput label="¿Cómo nos ha conocido?" isOptional={true} value={howHeard} onChangeText={setHowHeard} multiline numberOfLines={4} placeholder="Ej: Redes sociales, recomendación..." />
      </FormCard>
    </FadeInSection>
  );

  const renderReviewSection = (title, iconName, dataArray, onEditPress) => (
    <View style={styles.reviewSection}>
      <View style={styles.reviewSectionHeader}>
        {iconName && <Ionicons name={iconName} size={24} color={theme.secondaryColor} style={styles.reviewIconStyle} />}
        <Text style={styles.reviewSectionTitleText}>{title}</Text>
        {onEditPress && (
          <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
            <MaterialIcons name="edit" size={22} color={theme.primaryColor} />
          </TouchableOpacity>
        )}
      </View>
      {dataArray.length > 0 ? dataArray.map((item, index) => {
        // Validar el valor antes de renderizarlo
        let value = (typeof item.value === 'string') ? item.value.trim() : item.value;
        if (!value || value === '.' || value === '') value = 'No especificado';
        return (
        <View key={index} style={styles.reviewDetailItem}> 
          {item.label && <Text style={styles.reviewLabel}>{item.label}:</Text>}
            <Text style={styles.reviewTextValue}>{value}</Text>
        </View> 
        );
      }) : <Text style={styles.reviewNoDataText}>No hay datos para esta sección.</Text>}
    </View>
  );

  const renderReview = () => { 
    const animalDetails = animals.map((animal, index) => ({ 
      title: `Animal ${index + 1}: ${animal.nombre || "No especificado"}`, 
      icon: "paw-outline", 
      onEdit: () => navigateToEdit(0, index), 
      data: [ 
        { label: "Tipo", value: animal.tipo === 'otro' ? `Otro (${tipoExoticoOptions.find(opt => opt.value === animal.tipoExotico)?.label || animal.tipoExotico || 'N/A'})` : tipoAnimalOptions.find(opt => opt.value === animal.tipo)?.label }, 
        { label: "Sexo", value: sexoOptions.find(opt => opt.value === animal.sexo)?.label }, 
        { label: "Edad", value: edadAnimalOptions.find(opt => opt.value === animal.edad)?.label }, 
        { label: "Raza", value: animal.raza }, 
        animal.enfermedadesAnteriores && { label: "Enf. Previas", value: animal.enfermedadesAnteriores }, 
        animal.notasAdicionales && { label: "Notas", value: animal.notasAdicionales }, 
      ].filter(Boolean) 
    })); 
    
    const ownerDetails = { 
      title: "Datos del Dueño", 
      icon: "person-outline", 
      onEdit: () => navigateToEdit(1), 
      data: [ 
        { label: "Nombre", value: ownerData.nombre }, 
        { label: "Primer Apellido", value: ownerData.primerApellido }, 
        { label: "Segundo Apellido", value: ownerData.segundoApellido }, 
        { label: "Email", value: ownerData.email }, 
        { label: "Teléfono", value: ownerData.telefono }, 
      ].filter(item => item.value && item.value.trim() !== "") 
    }; 
    
    const discoveryDetails = howHeard.trim() ? { 
      title: "Cómo nos conoció", 
      icon: "search-outline", 
      onEdit: () => navigateToEdit(2), 
      data: [{ value: howHeard }] 
    } : null; 
    
    return ( 
    <FadeInSection animationKey="review-form"> 
        <FormCard title="Revisión Final de la Solicitud" style={styles.reviewOverallCard}> 
          {animalDetails.map((section, idx) => ( 
            <View key={`animal-section-${idx}`} style={styles.reviewBlock}> 
              {renderReviewSection(section.title, section.icon, section.data, section.onEdit)} 
            </View> 
          ))} 
          <View style={styles.reviewBlock}> 
            {renderReviewSection(ownerDetails.title, ownerDetails.icon, ownerDetails.data, ownerDetails.onEdit)} 
          </View> 
          {discoveryDetails && ( 
            <View style={styles.reviewBlock}> 
              {renderReviewSection(discoveryDetails.title, discoveryDetails.icon, discoveryDetails.data, discoveryDetails.onEdit)} 
            </View> 
          )} 
          <View style={styles.navigationButtons}> 
            <FormButton 
              title="Atrás" 
              onPress={prevStepAction} 
              variant="secondary" 
              style={styles.navigationButton} 
              iconName="arrow-back" 
            /> 
                <FormButton 
                    title={isLoading ? "Procesando..." : (currentUser ? "Guardar y Ver Opciones" : "Ver Opciones de Seguro")} 
                    onPress={handleSubmit} 
                    disabled={isLoading} 
              style={[styles.navigationButton, { backgroundColor: theme.success }]} 
                    iconName={currentUser ? "price-check" : "eye-outline"} 
                    iconSet={currentUser ? "MaterialIcons" : "Ionicons"} 
                /> 
            </View> 
        </FormCard> 
      </FadeInSection> 
    ); 
  };
  
  const showFooterBackButton = (currentStep === 0 && currentAnimalIndex > 0) || currentStep === 0.5 || currentStep === 1 || currentStep === 2;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={styles.outerContainer}>
        <Header title="Solicitar Presupuesto" onNavigateToHome={router.canGoBack() ? () => router.back() : () => router.push('/')} />
        <ProgressBar current={currentStep + 1} total={5} />
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.innerContainer}>
            {currentStep === 0 && renderAnimalTypeSelection()}
            {currentStep === 1 && renderBasicAnimalForm()}
            {currentStep === 2 && renderAdditionalInfoForm()}
            {currentStep === 3 && renderOwnerForm()}
            {currentStep === 4 && renderReview()}
            
            {/* Navegación solo para pasos normales (0-3) */}
            {currentStep !== 4 && (
              <View style={styles.navigationButtons}>
                <FormButton 
                  title="Atrás" 
                  onPress={prevStepAction} 
                  variant="secondary" 
                  style={styles.navigationButton} 
                  iconName="arrow-back" 
                />
                <FormButton 
                  title="Siguiente" 
                  onPress={nextStepAction} 
                  style={styles.navigationButton} 
                  iconName="arrow-forward" 
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: theme.offWhite },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingBottom: spacing.extraLarge },
  innerContainer: { width: '100%', maxWidth: Platform.OS === 'web' ? 720 : Dimensions.get('window').width * 0.94, paddingTop: spacing.small },
  progressBarContainer: { height: 10, backgroundColor: theme.greyLight, marginHorizontal: Platform.OS === 'web' ? 'auto' : Dimensions.get('window').width * 0.03, maxWidth: Platform.OS === 'web' ? 720 : Dimensions.get('window').width * 0.94, marginTop: spacing.medium, marginBottom: spacing.medium, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.primaryColor, borderRadius: 5 },
  cardBase: { backgroundColor: theme.white, borderRadius: theme.borderRadius, padding: spacing.large, marginBottom: spacing.large, borderWidth: 1, borderColor: theme.greyLight, },
  cardTitle: { ...typography.heading3, color: theme.primaryColor, marginBottom: spacing.large, textAlign: 'left', paddingBottom: spacing.medium, borderBottomWidth: 2, borderBottomColor: theme.primaryColor },
  inputGroup: { marginBottom: spacing.large },
  inputLabel: { ...typography.body, fontSize: 14, color: theme.secondaryColor, marginBottom: spacing.small, fontWeight: '600' },
  input: { 
    backgroundColor: theme.white, 
    borderColor: theme.greyMedium, 
    borderWidth: 1, 
    borderRadius: theme.borderRadius / 2, 
    paddingHorizontal: spacing.medium, 
    paddingVertical: Platform.OS === 'ios' ? spacing.medium -2 : spacing.medium -4, 
    fontSize: 15, 
    color: theme.dark, 
    minHeight: 48 
  },
  inputDisabled: { backgroundColor: theme.greyLight, color: theme.greyMedium },
  inputErrorBorder: { borderColor: theme.error, borderWidth: 1.5 },
  errorText: { color: theme.error, fontSize: 13, marginTop: spacing.small/2, marginLeft: spacing.small/2 },
  multilineInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: Platform.OS === 'ios' ? spacing.medium -2 : spacing.medium -4 },
  pickerInputContainer: { 
    backgroundColor: theme.white, 
    borderColor: theme.greyMedium, 
    borderWidth: 1, 
    borderRadius: theme.borderRadius / 2, 
    minHeight: 48, 
    justifyContent: 'center',
    marginTop: 0
  },
  pickerDisabledContainer: { backgroundColor: theme.greyLight },
  pickerElement: { 
    width: '100%', 
    color: theme.dark, 
    height: 48,
    marginLeft: 0
  },
  pickerPlaceholderItem: { fontSize: 15, color: theme.greyMedium },
  pickerItem: { fontSize: 15, color: theme.dark },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: theme.borderRadius * 2,
    minHeight: 50,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      }
    })
  },
  buttonPrimary: {
    backgroundColor: theme.primaryColor,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }
    })
  },
  buttonSecondary: {
    backgroundColor: theme.white,
    borderColor: theme.primaryColor,
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }
    })
  },
  buttonDisabled: {
    backgroundColor: theme.greyLight,
    borderColor: theme.greyMedium,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      }
    })
  },
  buttonText: {
    ...typography.button,
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: theme.primaryColor,
  },
  buttonTextDisabled: {
    color: theme.greyMedium,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.large,
    marginBottom: spacing.large,
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%'
  },
  navigationButton: {
    width: 200,
    height: 50,
    flex: 0,
    minHeight: 50,
    maxHeight: 50,
  },
  submitButtonInReview: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  fadeInViewBase: { width: '100%' },
  reviewNavigationButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: spacing.extraLarge, 
    gap: spacing.medium,
    backgroundColor: 'transparent'
  },
  promptCard: { backgroundColor: theme.white, borderColor: theme.primaryColor, borderWidth: 1, padding: spacing.large, alignItems:'center' },
  promptIcon: { marginBottom: spacing.medium },
  promptText: { ...typography.body, textAlign: 'center', marginBottom: spacing.large, fontSize: 16, lineHeight: 24, color: theme.secondaryColor },
  reviewOverallCard: { paddingVertical: spacing.large, paddingHorizontal: Platform.OS === 'web' ? spacing.large : spacing.medium, backgroundColor: theme.white, },
  reviewBlock: { marginBottom: spacing.extraLarge, backgroundColor: theme.offWhite, padding: spacing.large, borderRadius: theme.borderRadius, borderWidth: 1, borderColor: theme.greyLight, },
  reviewSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: spacing.medium, paddingBottom: spacing.medium, borderBottomWidth: 1, borderBottomColor: theme.greyMedium, },
  reviewSectionTitleText: { ...typography.heading3, fontSize: 19, color: theme.secondaryColor, marginLeft: spacing.medium, flex: 1, },
  editButton: { padding: spacing.small, },
  reviewItemContainer: { paddingVertical: spacing.small, },
  reviewItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.medium, },
  reviewItemTitle: { ...typography.heading3, fontSize: 17, color: theme.primaryColor, flex: 1, },
  reviewDetailsGrid: { },
  reviewDetailItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    paddingVertical: spacing.small / 1.5,
    borderBottomWidth: 1,
    borderBottomColor: theme.greyLight, 
    alignItems: 'flex-start', 
  },
  reviewLabel: { fontWeight: '700', color: theme.secondaryColor, fontSize: 15, marginRight: spacing.small, flexBasis: '40%', flexShrink:0 }, 
  reviewTextValue: { ...typography.body, fontSize: 15, color: theme.dark, flexShrink: 1, textAlign: 'left', flex: 1 }, 
  reviewNoDataText: { ...typography.body, color: theme.greyMedium, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.medium, },
  reviewIconStyle: {marginRight: spacing.small},
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderColor: theme.greyMedium,
    borderWidth: 1,
    borderRadius: theme.borderRadius / 2,
    marginBottom: spacing.small,
    paddingHorizontal: spacing.medium,
    minHeight: 40,
  },
  autocompleteListFixed: {
    position: Platform.OS === 'web' ? 'absolute' : 'relative',
    top: Platform.OS === 'web' ? 48 : 0,
    left: 0,
    right: 0,
    backgroundColor: theme.white,
    borderColor: theme.greyMedium,
    borderWidth: 1,
    borderTopWidth: 0,
    zIndex: 100,
    maxHeight: 180,
    minWidth: 180,
    maxWidth: 400,
    alignSelf: 'center',
    borderBottomLeftRadius: theme.borderRadius / 2,
    borderBottomRightRadius: theme.borderRadius / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'auto',
  },
  autocompleteItem: {
    padding: 12,
    borderBottomColor: theme.greyLight,
    borderBottomWidth: 1,
  },
  autocompleteText: {
    fontSize: 15,
    color: theme.dark,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.greyMedium,
    borderRadius: theme.borderRadius / 2,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.greyLight,
  },
  dropdownItemText: {
    fontSize: 15,
    color: theme.dark,
  },
  dropdownNoResult: {
    padding: 16,
    color: theme.greyMedium,
    textAlign: 'center',
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.greyLight,
    backgroundColor: theme.white,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.dark,
    padding: 8,
  },
  portalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  animalTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.medium,
    padding: spacing.medium,
  },
  animalTypeCard: {
    flex: 1,
    minWidth: 150,
    aspectRatio: 1,
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    padding: spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.primaryColor,
    ...theme.shadow,
  },
  animalTypeCardSelected: {
    backgroundColor: theme.primaryColor,
    borderColor: theme.primaryColor,
  },
  animalTypeTitle: {
    ...typography.heading3,
    marginTop: spacing.medium,
    color: theme.primaryColor,
  },
  animalTypeTitleSelected: {
    color: theme.white,
  },
});
