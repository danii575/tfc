// app/presupuestoFinal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Pressable,
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '../components/Header';
import { useAuth } from './_layout';

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
  borderRadius: 12, // borderRadius general
  buttonBorderRadius: 50, // borderRadius muy redondeado para botones tipo "pill"
  shadow: Platform.select({
    ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8 },
    android: { elevation: 6 },
    web: { boxShadow: '0 6px 12px rgba(0,0,0,0.1)' },
  }),
  hoverShadow: Platform.select({
    ios: { shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 10 },
    android: { elevation: 10 },
    web: { boxShadow: "0 8px 18px rgba(0,0,0,0.15)" }
  }),
};

const typography = {
  heading1: { fontSize: Platform.OS === 'web' ? 32 : 28, fontWeight: 'bold', color: theme.secondaryColor, textAlign: 'center' },
  heading2: { fontSize: Platform.OS === 'web' ? 26 : 22, fontWeight: 'bold', color: theme.secondaryColor, textAlign: 'center' },
  heading3: { fontSize: Platform.OS === 'web' ? 20 : 18, fontWeight: '600', color: theme.secondaryColor, textAlign: 'left' },
  body: { fontSize: 16, color: theme.dark, lineHeight: 24 },
  button: { fontSize: 16, fontWeight: '600', color: theme.white, textAlign: 'center' },
  caption: { fontSize: 12, color: theme.greyMedium, textAlign: "center" },
};

const spacing = { small: 8, medium: 14, large: 20, extraLarge: 28, ultraLarge: 48 };
const maxWidthContent = 1100;
const cardWidthMobile = Dimensions.get('window').width * 0.8;
const cardWidthWeb = 320;
// --- Fin Tema ---


// --- COMPONENTE AnimatedButton ---
const AnimatedButton = ({
  onPress,
  title,
  style, // Estilo para el contenedor Animated.View EXTERNO que lleva la sombra y transformación
  buttonStyle, // Estilo para el Pressable INTERNO (fondo, borde, padding, borderRadius)
  textStyle,
  iconName,
  iconColor,
  iconSize = 22,
  iconSet = "Ionicons",
  disabled = false,
  hoverScale = 1.03,
  pressScale = 0.97,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const IconComponent = iconSet === "MaterialIcons" ? MaterialIcons : iconSet === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;

  const animateScale = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 4, // Más rebote
      tension: 150, // Más rápido
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && !disabled) {
      setIsHovered(true);
      if (!isPressed) animateScale(hoverScale);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && !disabled) {
      setIsHovered(false);
      if (!isPressed) animateScale(1);
    }
  };

  const handlePressIn = () => {
    if (!disabled) {
      setIsPressed(true);
      animateScale(pressScale);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      setIsPressed(false);
      // Vuelve al estado de hover si el mouse sigue encima, o a 1 si no.
      if (Platform.OS === 'web' && isHovered) {
        animateScale(hoverScale);
      } else {
        animateScale(1);
      }
    }
  };

  // El Animated.View aplica la transformación de escala y la sombra
  const animatedWrapperStyle = [
    style, // Estilos base del wrapper (como márgenes, width)
    { transform: [{ scale: scaleAnim }] },
    (isHovered || isPressed) && !disabled ? theme.hoverShadow : theme.shadow, // Aplica sombra dinámicamente
    // El borderRadius del wrapper debe ser el mismo que el del Pressable para que la sombra se vea bien
    // Si el buttonStyle que se pasa ya tiene borderRadius, eso es suficiente.
    // Si el wrapper debe tener overflow: 'hidden', también debe tener el borderRadius.
  ];

  return (
    <Animated.View style={animatedWrapperStyle}>
      <Pressable
        onPress={!disabled ? onPress : null}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={({ pressed }) => [
            styles.buttonBase, // Estilos comunes del Pressable (flexDirection, alignItems, justifyContent)
            buttonStyle, // Estilos específicos (backgroundColor, padding, borderWidth, borderColor, borderRadius)
            disabled && styles.buttonDisabledStyle,
        ]}
        disabled={disabled}
      >
        {iconName && <IconComponent name={iconName} size={iconSize} color={iconColor || textStyle?.color || theme.white} style={{ marginRight: spacing.medium }} />}
        <Text style={[styles.buttonTextBase, textStyle, disabled && styles.buttonTextDisabledStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};
// --- FIN AnimatedButton ---


// --- Componente HoverView modificado para las tarjetas ---
const CardHoverView = ({ children, style, hoverStyle, scale = 1.02 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      Animated.spring(scaleAnim, { toValue: scale, friction: 5, useNativeDriver: false }).start();
    }
  };
  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: false }).start();
    }
  };

  // Aplicar borderRadius y overflow: 'hidden' al Animated.View que escala
  const animatedViewStyle = [
    style, // El 'style' que se pasa (styles.planCard) ya DEBE tener borderRadius
    { transform: [{ scale: scaleAnim }], overflow: 'hidden' }, // Añadimos overflow: 'hidden' aquí
    isHovered && hoverStyle, // Estilo de hover (ej. sombra más pronunciada)
  ];

  if (Platform.OS === 'web') {
    return (
      <Animated.View
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={animatedViewStyle}
      >
        {children}
      </Animated.View>
    );
  }
  // Para nativo, no aplicamos la animación de hover de la misma manera, así que solo devolvemos el View con su estilo.
  // Si se quiere un efecto de press en nativo para las tarjetas, se haría con Pressable.
  return <View style={style}>{children}</View>;
};


const FadeInSection = ({ children, duration = 400, style, animationKey }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; const translateY = useRef(new Animated.Value(15)).current;
  useEffect(() => {
    fadeAnim.setValue(0); translateY.setValue(15);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [animationKey, duration, fadeAnim, translateY]);
  return <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, styles.fadeInViewBase, style]}>{children}</Animated.View>;
};

const InfoCard = ({ title, children, style, iconName, iconSet = "Ionicons", titleCentered = false, titleStyle, titleIconColor }) => (
  // Usamos CardHoverView para el efecto de las InfoCards también, si se desea, o el HoverView original.
  // Por ahora, mantendré el HoverView original para InfoCard para no complicarlo demasiado a menos que se pida.
  <CardHoverView style={[styles.infoCardBase, theme.shadow, style]} hoverStyle={theme.hoverShadow} scale={1.01}>
    {title && (
        <View style={[styles.infoCardTitleContainer, titleCentered && {justifyContent: 'center'}]}>
            {iconName && (iconSet === "Ionicons" ?
                <Ionicons name={iconName} size={24} color={titleIconColor || theme.primaryColor} style={styles.infoCardTitleIcon} /> :
                <MaterialCommunityIcons name={iconName} size={24} color={titleIconColor || theme.primaryColor} style={styles.infoCardTitleIcon} />
            )}
            <Text style={[styles.infoCardTitle, titleCentered && {textAlign: 'center', marginLeft: iconName ? spacing.small: 0}, titleStyle]}>{title}</Text>
        </View>
    )}
    <View style={styles.infoCardContent}>{children}</View>
  </CardHoverView>
);

const PlanSelectionCard = ({ plan, onPress, isSelected }) => {
  // PlanSelectionCard ahora usará CardHoverView para el efecto de hover.
  // El TouchableOpacity interno es el hijo.
  return (
    <CardHoverView // Usamos el CardHoverView modificado
      style={[
        styles.planCard, // Este ya tiene borderRadius y otros estilos base de la tarjeta
        isSelected && styles.planCardSelected,
        plan.recommended && !isSelected && styles.recommendedPlanVisualHighlight,
        theme.shadow // Aplicamos la sombra base aquí, CardHoverView aplicará hoverShadow si está en hover
      ]}
      hoverStyle={theme.hoverShadow}
      scale={1.03}
    >
      <TouchableOpacity onPress={onPress} style={styles.planCardInnerTouchable} activeOpacity={0.9}>
            <View style={styles.planCardHeader}>
                <MaterialCommunityIcons name={plan.icon} size={36} color={isSelected ? theme.white : (plan.recommended ? theme.accentColor : theme.primaryColor)} />
                <Text style={[styles.planName, isSelected && styles.planNameSelected]}>{plan.name}</Text>
            </View>
            <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                {plan.priceDisplay || `${plan.price.replace('€/mes', '')}€/mes`}
            </Text>
             {plan.recommended && !isSelected && <View style={styles.recommendedBadge}><Text style={styles.recommendedBadgeText}>Recomendado</Text></View>}
            <Text style={[styles.planTeaser, isSelected && styles.planTeaserSelected]}>{plan.teaser || "Descripción breve del plan."}</Text>

            <View style={styles.planFeaturesList}>
                {plan.features.slice(0,3).map((feature, idx) => (
                     <View key={idx} style={styles.planFeatureItem}>
                        <Ionicons name="checkmark" size={16} color={isSelected ? theme.white : theme.primaryColor} style={{opacity: isSelected ? 0.8 : 1}} />
                        <Text style={[styles.planFeatureText, isSelected && styles.planFeatureTextSelected]}>{feature}</Text>
                    </View>
                ))}
                {plan.features.length > 3 && <Text style={[styles.planFeatureMoreText, isSelected && styles.planFeatureTextSelected]}>y más...</Text>}
            </View>

            <View style={[styles.selectPlanButton, isSelected && styles.selectPlanButtonSelected, plan.recommended && !isSelected && styles.recommendedSelectButton]}>
                <Text style={[styles.selectPlanButtonText, isSelected && styles.selectPlanButtonTextSelected, plan.recommended && !isSelected && styles.recommendedSelectButtonText]}>
                    {isSelected ? "Plan Seleccionado" : "Elegir Este Plan"}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.white} style={{marginLeft: spacing.small}}/>}
            </View>
        </TouchableOpacity>
    </CardHoverView>
  );
};

const FooterLink = ({ href, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();
    const handlePress = () => {
        if (href) {
            if (href.startsWith('/')) { router.push(href); }
            else if (href.startsWith('#')) {
                console.log("Intento de scroll a sección:", href);
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    const targetElement = window.document.getElementById(href.substring(1));
                    if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth' }); }
                    else { router.push(`/${href}`); }
                } else { Alert.alert("Navegación", `Ir a la sección: ${href}`); }
            } else { Alert.alert("Enlace Externo", `Esta acción abriría: ${href}. (No implementado)`);}
        }
    };
    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}
            onMouseEnter={() => Platform.OS === 'web' && setIsHovered(true)}
            onMouseLeave={() => Platform.OS === 'web' && setIsHovered(false)}
            style={styles.footerLinkTouchable}
        >
            <Text style={[styles.footerLinkText, isHovered && styles.footerLinkHover]}>{children}</Text>
        </TouchableOpacity>
    );
};

const Footer = () => (
  <View style={styles.footerBase}>
    <View style={styles.footerContent}>
      <View style={styles.footerColumns}>
        <View style={styles.footerColumn}>
          <Text style={styles.footerTitle}>🐾 PetCareSeguros</Text>
          <Text style={styles.footerText}>Protección y tranquilidad para ti y tu mascota. Cuidado experto al alcance de tu mano.</Text>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerTitle}>Navegación</Text>
          <FooterLink href="/#plans">Planes</FooterLink>
          <FooterLink href="/#about">Sobre Nosotros</FooterLink>
          <FooterLink href="/#steps">Servicios</FooterLink>
          <FooterLink href="/#contact">Contacto</FooterLink>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerTitle}>Legal</Text>
          <FooterLink href="/terminos">Términos y Condiciones</FooterLink>
          <FooterLink href="/privacidad">Política de Privacidad</FooterLink>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerTitle}>Contacto</Text>
          <Text style={styles.footerText}>📧 info@petcareseguros.com</Text>
          <Text style={styles.footerText}>📞 +34 900 123 456</Text>
        </View>
      </View>
      <View style={styles.copyrightContainer}>
        <Text style={styles.copyrightText}>© {new Date().getFullYear()} PetCareSeguros S.L. Todos los derechos reservados.</Text>
      </View>
    </View>
  </View>
);

const PLANS_DATA = [
  { id: "plan1", name: "Básico", price: "29€/mes", icon: "leaf", basePriceMonthly: "29.00", priceDisplay: "Desde 29.00€/mes", teaser: "La protección esencial para el día a día de tu mascota, ideal para cubrir lo fundamental.", features: [ "Consulta anual de bienestar veterinario", "Descuento en el esquema de vacunación anual", "Soporte 24/7 vía app", "Cobertura básica de emergencias", ], coverage: [ "1 consulta veterinaria de revisión bienestar anual gratuita en red concertada.", "Descuento del 20% en vacunas esenciales (rabia, trivalente/tetravalente felina, polivalente canina) en red concertada.", "Asistencia veterinaria telefónica y chat 24/7 para consultas y orientación.", "Cobertura de emergencias por accidente hasta 350€ por siniestro (franquicia de 60€). Incluye primera atención, estabilización y pruebas diagnósticas básicas urgentes.", "Responsabilidad Civil básica (hasta 60.000€) por daños a terceros.", "Servicio de recordatorio de vacunaciones y desparasitaciones.", ], exclusions: [ "Enfermedades preexistentes o congénitas no declaradas.", "Tratamientos preventivos no incluidos en el descuento de vacunación (ej. desparasitación, tests específicos).", "Cirugías electivas, estéticas o no derivadas de una emergencia cubierta.", "Medicación para tratamientos crónicos o no relacionados con emergencias cubiertas.", "Consultas a especialistas, hospitalización prolongada o pruebas diagnósticas complejas (TAC, resonancias).", "Tratamientos dentales (excepto los derivados de un accidente cubierto).", ], extraInfo: "Periodo de carencia: 30 días para enfermedades, 72 horas para accidentes. Descuento del 5% por pago anual. Posibilidad de añadir microchip con coste reducido al contratar.", recommended: false, },
  { id: "plan2", name: "Avanzado", price: "49€/mes", icon: "shield-check-outline", basePriceMonthly: "49.00", priceDisplay: "Desde 49.00€/mes", teaser: "Cobertura completa para una mayor tranquilidad, con acceso a más servicios y diagnósticos.", features: [ "Consultas ilimitadas", "Descuento en medicamentos", "Acceso a telemedicina", "Cobertura media en cirugías", "Servicio de recordatorio de citas", ], coverage: [ "Consultas veterinarias ilimitadas en red concertada (revisión, enfermedad, accidente).", "Reembolso del 50% en consultas fuera de red concertada (límite 3/año).", "Descuento del 15% en medicamentos prescritos en farmacias asociadas o reembolso parcial.", "Acceso ilimitado a plataforma de telemedicina veterinaria con videoconsulta.", "Cobertura de cirugías (accidentes y enfermedades comunes) hasta 1.800€/año (franquicia de 100€ por cirugía).", "Hospitalización hasta 5 días por evento (límite 1.200€/año), incluye medicación y cuidados.", "Pruebas diagnósticas (análisis de sangre, orina, ecografías, radiografías) hasta 400€/año.", "Responsabilidad Civil ampliada (hasta 150.000€) por daños a terceros.", "Servicio de recordatorio de citas y seguimiento post-operatorio.", "Cobertura dental básica: 1 limpieza dental anual con descuento del 50%.", ], exclusions: [ "Enfermedades preexistentes no declaradas o crónicas sin estabilización previa.", "Tratamientos dentales complejos (ortodoncia, endodoncia) más allá de la limpieza con descuento.", "Prótesis, ortopedia (salvo por accidente y con co-pago).", "Tratamientos de comportamiento, adiestramiento.", "Alimentación especial o suplementos (salvo prescripción post-quirúrgica inmediata).", ], extraInfo: "Periodo de carencia: 15 días para enfermedades, 48 horas para accidentes. Descuento del 8% por pago anual. Opción de añadir pack de prevención anual (vacunas completas y desparasitación interna/externa) por +12€/mes.", recommended: true, },
  { id: "plan3", name: "Premium", price: "79€/mes", icon: "star-outline", basePriceMonthly: "79.00", priceDisplay: "Desde 79.00€/mes", teaser: "La máxima protección con coberturas extendidas, servicios exclusivos y libre elección.", features: [ "Cobertura total en emergencias", "Medicamentos incluidos", "Peluquería y Bienestar", "Asistencia VIP 24/7", "Chequeo dental anual", "Plan nutricional personalizado", ], coverage: [ "Libre elección de veterinario a nivel nacional con reembolso del 80-90% de gastos (según baremo).", "Cobertura completa en emergencias (incluye UCI, pruebas avanzadas) sin límite anual significativo (consultar condiciones específicas).", "Reembolso del 80% en medicamentos prescritos (hasta 500€/año).", "1 servicio de peluquería y/o bienestar básico trimestral incluido en centros asociados.", "Asistencia VIP con gestor personal para trámites, citas y segunda opinión veterinaria.", "Chequeo dental anual completo (incluye limpieza, radiografías si es necesario, y extracciones simples) sin coste adicional.", "Consulta para plan nutricional personalizado y 2 seguimientos anuales.", "Cobertura de cirugías complejas y especializadas hasta 6.000€/año (sin franquicia o franquicia reducida).", "Hospitalización ilimitada (según criterio veterinario y necesidad médica).", "Pruebas diagnósticas avanzadas (resonancias, TAC, endoscopias) con autorización previa, hasta 1.500€/año.", "Responsabilidad Civil Premium (hasta 350.000€), incluye defensa jurídica.", "Fisioterapia y rehabilitación (hasta 15 sesiones/año) con prescripción.", "Cobertura por robo o extravío (gastos de búsqueda y compensación, según condiciones).", ], exclusions: [ "Enfermedades preexistentes no declaradas y sin informe veterinario detallado al contratar.", "Tratamientos experimentales, alternativos no reconocidos o cosméticos.", "Gastos de viaje o alojamiento del propietario, salvo casos excepcionales cubiertos.", "Cría y gestación (salvo complicaciones cubiertas específicamente).", ], extraInfo: "Sin periodo de carencia para accidentes, 7 días para enfermedades comunes. Descuento del 10% por pago anual. Incluye asistencia en viaje nacional para la mascota. Acceso a red de especialistas y descuentos en productos premium.", recommended: false, },
];


export default function PresupuestoFinalPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser, userData } = useAuth();

  const [parsedAnimals, setParsedAnimals] = useState([]);
  const [parsedOwnerData, setParsedOwnerData] = useState({ nombre: "" });
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let animalsList = [];
    if (params.animals && typeof params.animals === 'string') {
      try { const tempAnimals = JSON.parse(params.animals); if(Array.isArray(tempAnimals)) { animalsList = tempAnimals; }
      } catch (e) { console.error("Error parseando 'animals' en presupuestoFinal:", e); }
    }
    setParsedAnimals(animalsList);

    let ownerInfo = { nombre: "Estimado Cliente", primerApellido: "", segundoApellido: "", email: "", telefono: "" };
    if (params.ownerData && typeof params.ownerData === 'string') {
      try {
        const ownerFromParams = JSON.parse(params.ownerData);
        if (ownerFromParams?.nombre?.trim()) { 
          ownerInfo = {
            nombre: ownerFromParams.nombre || "",
            primerApellido: ownerFromParams.primerApellido || "",
            segundoApellido: ownerFromParams.segundoApellido || "",
            email: ownerFromParams.email || "",
            telefono: ownerFromParams.telefono || ""
          }; 
        }
        else if (currentUser) { 
          ownerInfo = { 
            nombre: userData?.nombre || currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0] || "Cliente",
            primerApellido: userData?.primerApellido || currentUser.displayName?.split(' ')[1] || "",
            segundoApellido: userData?.segundoApellido || currentUser.displayName?.split(' ')[2] || "",
            email: userData?.email || currentUser.email || "",
            telefono: userData?.telefono || ""
          }; 
        }
      } catch (e) {
          console.error("Error parseando 'ownerData' en presupuestoFinal:", e);
          if (currentUser) { 
            ownerInfo = { 
              nombre: userData?.nombre || currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0] || "Cliente",
              primerApellido: userData?.primerApellido || currentUser.displayName?.split(' ')[1] || "",
              segundoApellido: userData?.segundoApellido || currentUser.displayName?.split(' ')[2] || "",
              email: userData?.email || currentUser.email || "",
              telefono: userData?.telefono || ""
            }; 
          }
      }
    } else if (currentUser) {
        ownerInfo = { 
          nombre: userData?.nombre || currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0] || "Cliente",
          primerApellido: userData?.primerApellido || currentUser.displayName?.split(' ')[1] || "",
          segundoApellido: userData?.segundoApellido || currentUser.displayName?.split(' ')[2] || "",
          email: userData?.email || currentUser.email || "",
          telefono: userData?.telefono || ""
        };
    }
    setParsedOwnerData(ownerInfo);
    setIsGuestUser(params.isGuest === "true" || (!params.uidUsuario && !currentUser));
  }, [params, currentUser, userData]);

  const [selectedPlanId, setSelectedPlanId] = useState(params.selectedPlanId || PLANS_DATA.find(p => p.recommended)?.id || PLANS_DATA[0]?.id);
  const mainScrollViewRef = useRef(null);
  const selectedPlan = PLANS_DATA.find(p => p.id === selectedPlanId);

  let finalPriceDisplay = "N/A";
  const numAnimals = parsedAnimals.length;

  if (selectedPlan) {
    const basePrice = parseFloat(selectedPlan.basePriceMonthly);
    if (!isNaN(basePrice)) {
        if (numAnimals > 0) {
            let totalMultiplier = 0;
            if (numAnimals === 1) totalMultiplier = 1;
            else if (numAnimals === 2) totalMultiplier = 1 + 0.9;
            else if (numAnimals >=3) totalMultiplier = 1 + 0.9 + ( (numAnimals - 2) * 0.85);
            const calculatedPrice = basePrice * totalMultiplier;
            finalPriceDisplay = `${calculatedPrice.toFixed(2)}€/mes (${numAnimals} mascota${numAnimals !== 1 ? 's' : ''})`;
        } else { finalPriceDisplay = `Desde ${selectedPlan.basePriceMonthly}€/mes (Precio base individual)`; }
    } else { finalPriceDisplay = selectedPlan.price || "Precio no disponible"; }
  }

  const handleContratarPlan = async () => {
    console.log("[handleContratarPlan] Iniciando proceso de contratación");
    console.log("[handleContratarPlan] currentUser:", currentUser);
    console.log("[handleContratarPlan] parsedOwnerData:", parsedOwnerData);
    
    if (!currentUser) {
      // Si el usuario no está autenticado, redirigir al registro con los datos del presupuesto
      console.log("[handleContratarPlan] Usuario no autenticado, redirigiendo a registro");
      const presupuestoData = {
        fromPresupuesto: 'true',
        animals: JSON.stringify(parsedAnimals),
        ownerData: JSON.stringify({
          nombre: parsedOwnerData.nombre,
          primerApellido: parsedOwnerData.primerApellido,
          segundoApellido: parsedOwnerData.segundoApellido,
          email: parsedOwnerData.email,
          telefono: parsedOwnerData.telefono
        }),
        howHeard: params.howHeard || "",
        selectedPlanId: selectedPlanId,
        planNombre: selectedPlan?.name || "",
        precioEstimado: finalPriceDisplay,
        numeroMascotas: parsedAnimals.length.toString()
      };
      
      console.log("[handleContratarPlan] Datos para registro:", presupuestoData);
      
      router.push({
        pathname: '/registro',
        params: presupuestoData
      });
      return;
    }

    // Si el usuario está autenticado, redirigir a datosCompletos
    try {
      setIsLoading(true);
      console.log("[handleContratarPlan] Usuario autenticado, redirigiendo a datosCompletos");
      
      const datosCompletosParams = {
        animals: JSON.stringify(parsedAnimals),
        ownerData: JSON.stringify({
          nombre: parsedOwnerData.nombre,
          primerApellido: parsedOwnerData.primerApellido,
          segundoApellido: parsedOwnerData.segundoApellido,
          email: parsedOwnerData.email,
          telefono: parsedOwnerData.telefono
        }),
        howHeard: params.howHeard || "",
        selectedPlanId: selectedPlanId,
        planNombre: selectedPlan?.name || "",
        precioEstimado: finalPriceDisplay,
        numeroMascotas: parsedAnimals.length.toString(),
        fromPresupuestoFinal: 'true'
      };
      
      router.push({
        pathname: '/datosCompletos',
        params: datosCompletosParams
      });
      
    } catch (error) {
      console.error('[handleContratarPlan] Error al procesar solicitud:', error);
      Alert.alert('Error', 'Hubo un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const ownerDisplayName = parsedOwnerData?.nombre?.trim() || "Estimado Cliente";
  const petCountText = numAnimals > 0 ? (numAnimals === 1 ? `tu mascota (${parsedAnimals[0]?.nombre || 'nombre no especificado'})` : `tus ${numAnimals} mascotas`) : "tus futuras mascotas";

  return (
    <View style={styles.outerContainer}>
      <Header title="Tu Presupuesto Personalizado" onNavigateToHome={() => router.replace('/')} />
      <ScrollView ref={mainScrollViewRef} style={styles.scrollViewStyle} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" >
        <View style={styles.innerContainer}>
            <FadeInSection animationKey={`intro-${ownerDisplayName}-${numAnimals}`} style={styles.pageHeader}>
                <Text style={styles.pageTitle}>¡Gracias, {ownerDisplayName}!</Text>
                <Text style={styles.pageSubtitle}>Hemos preparado estas opciones de seguro para {petCountText}. Selecciona un plan para ver todos los detalles y coberturas.</Text>
            </FadeInSection>

            <View style={styles.planSectionWrapper}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPlanContainer} >
                    {PLANS_DATA.map((plan, index) => (
                        <View key={plan.id} style={styles.planCardFadeWrapper}> {/* View wrapper para el FadeInSection de la tarjeta */}
                            <FadeInSection animationKey={`plan-card-${index}-${numAnimals}`} duration={300 + index * 100} style={{flex: 1}} >{/* FadeInSection ahora es flex:1 */}
                                <PlanSelectionCard
                                    plan={plan}
                                    onPress={() => {
                                        setSelectedPlanId(plan.id);
                                        const yOffsetForDetails = Platform.OS === 'web' ? 500 : Dimensions.get('window').height * 0.4;
                                        if (mainScrollViewRef.current) { mainScrollViewRef.current.scrollTo({ y: yOffsetForDetails, animated: true }); }
                                    }}
                                    isSelected={selectedPlanId === plan.id}
                                />
                            </FadeInSection>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {selectedPlan && (
                <View style={styles.selectedPlanDetailsSection}>
                    <FadeInSection animationKey={`plan-${selectedPlanId}-${numAnimals}`}>
                        <Text style={styles.selectedPlanTitle}>Detalles del {selectedPlan.name}</Text>
                        <InfoCard title="Precio Estimado Final" iconName="cash-outline" style={styles.priceCard} titleCentered={true} titleStyle={styles.priceCardTitleText} titleIconColor={theme.white} >
                            <Text style={styles.finalPriceText}>{finalPriceDisplay}</Text>
                            <Text style={styles.priceDisclaimerText}>Estimación basada en el número de mascotas y plan seleccionado. El precio final puede variar según características específicas y promociones. Se confirmará antes de la contratación.</Text>
                        </InfoCard>
                        <InfoCard title="Coberturas Principales" iconName="shield-checkmark-outline" iconSet="Ionicons">
                            {selectedPlan.coverage.map((item, index) => ( <View key={`cov-${index}`} style={[styles.detailListItem, index === selectedPlan.coverage.length - 1 && styles.lastDetailListItem]}> <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} style={styles.listItemIcon} /> <Text style={styles.detailListText}>{item}</Text> </View> ))}
                        </InfoCard>
                        <InfoCard title="Exclusiones Importantes" iconName="close-circle-outline" iconSet="Ionicons">
                             {selectedPlan.exclusions.map((item, index) => ( <View key={`exc-${index}`} style={[styles.detailListItem, index === selectedPlan.exclusions.length - 1 && styles.lastDetailListItem]}> <Ionicons name="remove-circle-outline" size={20} color={theme.error} style={styles.listItemIcon} /> <Text style={styles.detailListText}>{item}</Text> </View> ))}
                        </InfoCard>
                        {selectedPlan.extraInfo && <InfoCard title="Información Adicional y Extras" iconName="information-circle-outline" iconSet="Ionicons"> <Text style={styles.extraInfoText}>{selectedPlan.extraInfo}</Text> </InfoCard> }
                        <View style={styles.ctaButtonContainer}>
                            <AnimatedButton title="Me Interesa - Solicitar Contratación" onPress={handleContratarPlan} style={styles.animatedButtonWrapper} buttonStyle={styles.mainCtaButtonInternal} textStyle={styles.mainCtaButtonText} iconName="document-text-outline" iconColor={theme.white} />
                            <AnimatedButton title="Modificar Datos del Presupuesto" onPress={() => router.push('/presupuesto')} style={styles.animatedButtonWrapper} buttonStyle={styles.secondaryCtaButtonInternal} textStyle={styles.secondaryCtaButtonText} iconName="arrow-back-outline" iconColor={theme.primaryColor} />
                        </View>
                    </FadeInSection>
                </View>
            )}
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: theme.offWhite, },
  scrollViewStyle: { flex: 1, },
  scrollContentContainer: { flexGrow: 1, },
  innerContainer: { width: '100%', maxWidth: maxWidthContent, paddingHorizontal: Platform.OS === 'web' ? spacing.large : spacing.medium, alignSelf: 'center', paddingBottom: spacing.ultraLarge, },
  fadeInViewBase: { width: '100%' },
  pageHeader: { alignItems: 'center', marginVertical: spacing.ultraLarge, paddingHorizontal: spacing.medium },
  pageTitle: { ...typography.heading1, color: theme.secondaryColor, marginBottom: spacing.medium },
  sectionTitle: { ...typography.heading2, fontSize: Platform.OS === 'web' ? 24 : 20, color: theme.secondaryColor, marginBottom: spacing.large, textAlign: 'center', },
  pageSubtitle: { ...typography.body, fontSize: 17, textAlign: 'center', color: theme.greyMedium, lineHeight: 26, maxWidth: 650 },
  planSectionWrapper: { marginBottom: spacing.ultraLarge, width: '100%', },
  horizontalPlanContainer: { flexDirection: 'row', paddingHorizontal: spacing.medium, paddingVertical: spacing.small, alignItems: 'stretch', },
  planCardFadeWrapper: { width: Platform.OS === 'web' ? cardWidthWeb : cardWidthMobile, marginRight: spacing.large, display: 'flex', flexDirection: 'column' }, // Asegura que el wrapper tenga display flex
  // planCardWrapper: { flex: 1, }, // Eliminado, PlanSelectionCard usará el estilo de CardHoverView directamente
  planCard: { // Estilo base de la tarjeta, se pasa a CardHoverView
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius, // borderRadius se aplica aquí
    // padding: spacing.large, // Padding irá en planCardInnerTouchable
    // ...theme.shadow, // Sombra se pasa a CardHoverView
    borderWidth: 2,
    borderColor: theme.greyLight,
    minHeight: Platform.OS === 'web' ? 480 : 450,
    height: '100%',
    justifyContent: 'space-between',
    flexDirection: 'column',
    // overflow: 'hidden', // Se maneja en CardHoverView
  },
  planCardInnerTouchable: { // Nuevo: Contenedor interno para el contenido del TouchableOpacity
      flex: 1,
      padding: spacing.large,
      justifyContent: 'space-between',
      flexDirection: 'column',
  },
  planCardSelected: { borderColor: theme.primaryColor, backgroundColor: theme.primaryColor, transform: Platform.OS === 'web' ? [{scale: 1.03}] : [], shadowColor: theme.primaryColor, shadowOpacity: 0.3, shadowRadius: 10, elevation: Platform.OS === 'android' ? 10 : 0, },
  recommendedPlanVisualHighlight: { borderColor: theme.accentColor, borderWidth: 3, },
  planCardHeader: { alignItems: 'center', marginBottom: spacing.medium },
  planName: { ...typography.heading2, fontSize: 20, color: theme.secondaryColor, marginBottom: spacing.small, textAlign: 'center', },
  planNameSelected: { color: theme.white },
  planPrice: { ...typography.body, fontSize: 17, fontWeight: 'bold', color: theme.primaryColor, marginBottom: spacing.medium, textAlign: 'center' },
  planPriceSelected: { color: theme.white },
  planTeaser: { ...typography.body, fontSize: 13, color: theme.greyMedium, textAlign: 'center', marginBottom: spacing.medium, minHeight: 38, },
  planTeaserSelected: { color: theme.offWhite + 'DD', },
  planFeaturesList: { marginVertical: spacing.medium, flexGrow: 1, },
  planFeatureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.small },
  planFeatureText: { ...typography.body, fontSize: 12, marginLeft: spacing.small, color: theme.dark, },
  planFeatureTextSelected: { color: theme.white, },
  planFeatureMoreText: { ...typography.caption, fontSize: 11, textAlign: 'center', marginTop: spacing.small, fontStyle: 'italic', color: theme.greyMedium, },
  selectPlanButton: { flexDirection: 'row', backgroundColor: theme.primaryColor + '1A', paddingVertical: spacing.medium -2, paddingHorizontal: spacing.medium, borderRadius: theme.buttonBorderRadius, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.primaryColor, marginTop: 'auto', },
  selectPlanButtonSelected: { backgroundColor: theme.white, borderColor: theme.white },
  recommendedSelectButton: { backgroundColor: theme.accentColor, borderColor: theme.accentColor, },
  selectPlanButtonText: { ...typography.button, fontSize: 14, color: theme.primaryColor },
  selectPlanButtonTextSelected: { color: theme.primaryColor },
  recommendedSelectButtonText: { color: theme.secondaryColor, fontWeight: 'bold', },
  recommendedBadge: { position: 'absolute', top: spacing.medium, right: spacing.medium, backgroundColor: theme.accentColor, paddingVertical: spacing.small / 2, paddingHorizontal: spacing.small, borderRadius: theme.borderRadius / 2, zIndex: 1, ...theme.shadow, },
  recommendedBadgeText: { color: theme.secondaryColor, fontSize: 11, fontWeight: 'bold' },
  selectedPlanDetailsSection: { marginVertical: spacing.ultraLarge },
  selectedPlanTitle: { ...typography.heading1, fontSize: 28, color: theme.primaryColor, marginBottom: spacing.ultraLarge, textAlign: 'center' },
  infoCardBase: { backgroundColor: theme.white, borderRadius: theme.borderRadius, padding: spacing.large, marginBottom: spacing.large, ...theme.shadow, overflow: 'hidden' }, // Añadido overflow: 'hidden' a InfoCard
  infoCardTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.medium, paddingBottom: spacing.medium, borderBottomWidth: 1, borderBottomColor: theme.greyLight },
  infoCardTitleIcon: { marginRight: spacing.medium },
  infoCardTitle: { ...typography.heading3, fontSize: 20, color: theme.secondaryColor },
  infoCardContent: { paddingTop: spacing.small, },
  priceCard: { backgroundColor: theme.primaryColor, paddingVertical: spacing.extraLarge },
  priceCardTitleText: { color: theme.white, },
  finalPriceText: { ...typography.heading1, fontSize: 36, color: theme.white, textAlign: 'center', marginBottom: spacing.small },
  priceDisclaimerText: { ...typography.body, fontSize: 13, color: theme.offWhite + 'CC', textAlign: 'center', lineHeight: 18, },
  detailListItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.medium - 4 , borderBottomWidth: 1, borderBottomColor: theme.greyLight + 'AA' },
  lastDetailListItem: { borderBottomWidth: 0, },
  listItemIcon: { marginRight: spacing.medium, marginTop: 3 },
  detailListText: { ...typography.body, fontSize: 15, lineHeight: 22, flex: 1, },
  extraInfoText: { ...typography.body, fontSize: 15, lineHeight: 24, color: theme.dark, },
  ctaButtonContainer: { marginTop: spacing.ultraLarge, gap: spacing.medium + 4, alignItems: 'center', },
  animatedButtonWrapper: { // Contenedor para la sombra y transformación del AnimatedButton
    width: Platform.OS === 'web' ? 380 : '95%',
    maxWidth: 450,
    borderRadius: theme.buttonBorderRadius, // Añadimos el mismo borderRadius que el botón
    overflow: 'hidden', // Añadimos overflow hidden para contener el contenido
  },
  buttonBase: { // Estilos comunes del Pressable (layout interno)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Aseguramos que ocupe todo el ancho del contenedor
    height: '100%', // Aseguramos que ocupe toda la altura del contenedor
  },
  buttonTextBase: { ...typography.button, },
  mainCtaButtonInternal: { // Estilo para el Pressable
    backgroundColor: theme.success,
    paddingVertical: spacing.large,
    paddingHorizontal: spacing.extraLarge,
    borderRadius: theme.buttonBorderRadius, // Botón tipo "pill"
    width: '100%', // Aseguramos que ocupe todo el ancho
  },
  mainCtaButtonText: { color: theme.white, fontSize: 18, },
  secondaryCtaButtonInternal: { // Estilo para el Pressable
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.primaryColor,
    paddingVertical: spacing.large -2,
    paddingHorizontal: spacing.extraLarge,
    borderRadius: theme.buttonBorderRadius, // Botón tipo "pill"
    width: '100%', // Aseguramos que ocupe todo el ancho
  },
  secondaryCtaButtonText: { color: theme.primaryColor, fontSize: 16, },
  buttonDisabledStyle: { backgroundColor: theme.greyLight, borderColor: theme.greyMedium, opacity: 0.7 },
  buttonTextDisabledStyle: { color: theme.greyMedium, },
  footerBase: { backgroundColor: theme.secondaryColor, width: '100%', paddingVertical: spacing.large, marginTop: spacing.ultraLarge, },
  footerContent: { maxWidth: maxWidthContent, width: '100%', alignSelf: 'center', paddingHorizontal: spacing.large, },
  footerColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.large, justifyContent: 'space-between' },
  footerColumn: { flex: 1, minWidth: Platform.OS === 'web' ? 200 : '45%', maxWidth: 280, marginBottom: spacing.medium, },
  footerTitle: { ...typography.heading3, fontSize: 18, color: theme.white, marginBottom: spacing.medium },
  footerText: { ...typography.body, fontSize: 14, color: theme.greyLight + 'DD', lineHeight: 22 },
  footerLinkTouchable: { paddingVertical: spacing.small / 1.5 },
  footerLinkText: { ...typography.body, fontSize: 14, color: theme.white, opacity: 0.85, fontWeight: '500' },
  footerLinkHover: { opacity: 1, color: theme.primaryColor },
  copyrightContainer: { width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', paddingTop: spacing.large, marginTop: spacing.large },
  copyrightText: { ...typography.caption, fontSize: 13, color: theme.greyMedium, textAlign: 'center' },
});