// app/index.js
"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  FlatList,
  ImageBackground,
  Image,
  Platform,
  Easing,
  findNodeHandle, // Necesario para measureLayout en nativo, aunque deprecado
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Header from "../components/Header"; 
import { useAuth } from './_layout';
//hola a
// --- Paleta de Colores Refinada ---
const theme = {
  primaryColor: "#2A9D8F", // Verde azulado principal (Teal)
  secondaryColor: "#264653", // Azul oscuro/petróleo (Dark Slate Gray)
  accentColor: "#E9C46A", // Amarillo Azafrán
  mutedPrimary: "#A8DADC", // Un verde azulado más claro y suave
  offWhite: '#FAF7F2',       // Blanco roto cálido para fondos neutros
  success: "#28a745",
  error: "#E76F51", // Naranja rojizo (Coral) para errores o énfasis
  info: "#17a2b8",
  white: "#FFFFFF",
  greyLight: "#E9ECEF", // Gris muy claro
  dark: "#343a40", // Gris oscuro para texto
  greyMedium: "#6c757d", // Gris medio para texto secundario
  borderRadius: 10, // Bordes ligeramente más redondeados
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    android: {
      elevation: 4, // Sombra ligeramente más pronunciada
    },
    web: {
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)", // Sombra web más suave
    },
  }),
  // Sombra más pronunciada para efectos hover en web
  hoverShadow: Platform.OS === 'web' ? { boxShadow: "0 6px 15px rgba(0,0,0,0.12)" } : {},
};

// --- Tipografía ---
const typography = {
  heading1: {
    fontSize: Platform.OS === "web" ? 38 : 34,
    fontWeight: "bold",
    color: theme.secondaryColor,
    textAlign: "center",
  },
  heading2: {
    fontSize: Platform.OS === "web" ? 30 : 26,
    fontWeight: "bold",
    color: theme.secondaryColor,
    textAlign: "center",
  },
  heading3: {
    fontSize: Platform.OS === "web" ? 22 : 20,
    fontWeight: "600",
    color: theme.secondaryColor,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: theme.dark,
    lineHeight: 26,
    textAlign: "center",
  },
  caption: {
    fontSize: 12,
    color: theme.greyMedium,
    textAlign: "center",
  },
  button: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
    textAlign: "center",
  },
};

// --- Espaciado y Bordes ---
const spacing = {
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
  ultraLarge: 48,
};

const borderRadius = {
  small: 4,
  medium: 8,
  large: theme.borderRadius,
};

const maxWidth = 1200;
const heroHeight = Platform.select({ web: '100vh', default: 400 });

// --- Imágenes y Constantes ---
const images = {
  HERO: require("../assets/images/pet-hero.png"),
  PERRO: require("../assets/images/perro.jpg"),
  PERRO2: require("../assets/images/perro2.jpg"),
  LABRADOR: require("../assets/images/un-perro-de-raza-labrador.jpeg"),
  GATO: require("../assets/images/gato.jpg"),
  GATO1: require("../assets/images/gato1.jpg"),
  GATO3: require("../assets/images/gato3.jpg"),
  HAMSTER: require("../assets/images/hamster2.jpg"),
  HURON: require("../assets/images/huron.png"),
  TORTUGA: require("../assets/images/tortuga.jpg"),
};

// --- Datos ---
const PLANS = [
  {
    id: "plan1",
    name: "Básico",
    price: "29€/mes",
    icon: "leaf",
    features: [
      "Consulta anual de bienestar veterinario",
      "Descuento en el esquema de vacunación anual",
      "Soporte 24/7 vía app",
      "Cobertura básica de emergencias",
    ],
  },
  {
    id: "plan2",
    name: "Avanzado",
    price: "49€/mes",
    icon: "shield-check-outline",
    recommended: true,
    features: [
      "Consultas ilimitadas",
      "Descuento en medicamentos",
      "Acceso a telemedicina",
      "Cobertura media en cirugías",
      "Servicio de recordatorio de citas",
    ],
  },
  {
    id: "plan3",
    name: "Premium",
    price: "79€/mes",
    icon: "star-outline",
    features: [
      "Cobertura total en emergencias",
      "Medicamentos incluidos",
      "Servicios de spa para mascotas",
      "Asistencia VIP 24/7",
      "Chequeo dental anual",
      "Plan nutricional personalizado",
    ],
  },
];
const STEPS = [
  {
    id: "step1",
    title: "Selecciona un Plan",
    icon: "format-list-bulleted",
    description: "Elige el plan que mejor se adapte a tus necesidades y presupuesto.",
  },
  {
    id: "step2",
    title: "Registra tu Mascota",
    icon: "paw",
    description: "Completa fácilmente el formulario online con los datos de tu compañero.",
  },
  {
    id: "step3",
    title: "Protección Total",
    icon: "heart-plus-outline",
    description: "Una vez activado, disfruta de la tranquilidad y beneficios inmediatamente.",
  },
];
const TESTIMONIALS = [
  {
    id: "1",
    quote: "Excelente servicio, mi perro recibió la mejor atención cuando más lo necesitaba. El reembolso fue rápido y sin complicaciones.",
    author: "Ana G.",
    pet: "Toby, Labrador",
  },
  {
    id: "2",
    quote: "Los reembolsos fueron rápidos y el proceso muy sencillo. La atención telefónica es excelente, muy recomendable.",
    author: "Luis M.",
    pet: "Luna, Mestizo",
  },
  {
    id: "3",
    quote: "Estoy tranquilo sabiendo que mi gata está protegida. El plan premium vale cada euro, especialmente por la cobertura de medicamentos.",
    author: "Carla R.",
    pet: "Mía, Siamés",
  },
  {
    id: "4",
    quote: "La app es muy intuitiva y el servicio de emergencias 24/7 me da mucha tranquilidad. Totalmente recomendable.",
    author: "María S.",
    pet: "Rocky, Pastor Alemán",
  },
  {
    id: "5",
    quote: "El veterinario asignado es muy profesional y atento. Las consultas online son muy útiles para dudas rápidas.",
    author: "Juan P.",
    pet: "Nala, Golden Retriever",
  },
  {
    id: "6",
    quote: "La cobertura dental incluida en el plan premium ha sido un gran alivio. El proceso de reembolso es muy sencillo.",
    author: "Laura M.",
    pet: "Max, Yorkshire",
  },
  {
    id: "7",
    quote: "El servicio de recordatorio de vacunas es muy útil. Nunca más se me ha olvidado una cita importante.",
    author: "Pedro L.",
    pet: "Lola, Bulldog Francés",
  },
  {
    id: "8",
    quote: "La atención personalizada y el seguimiento del caso de mi perro ha sido excepcional. Muy agradecido.",
    author: "Sofía C.",
    pet: "Thor, Husky Siberiano",
  },
  {
    id: "9",
    quote: "El plan nutricional personalizado ha mejorado mucho la salud de mi gato. El asesoramiento es excelente.",
    author: "Diego R.",
    pet: "Milo, Maine Coon",
  }
];
const FAQS = [
    {
    id: "faq1",
    question: "¿Qué cubre el plan Básico?",
    answer:
      "El plan Básico incluye cobertura para cuidados esenciales como consultas anuales, descuentos en vacunas y atención básica de emergencias. Es ideal para mascotas jóvenes y saludables que necesitan principalmente cuidados preventivos.",
  },
  {
    id: "faq2",
    question: "¿Puedo cambiar de veterinario?",
    answer:
      "Sí, tienes la libertad de elegir cualquier veterinario colegiado. Nuestro plan te permite visitar al veterinario de tu confianza sin restricciones de red.",
  },
  {
    id: "faq3",
    question: "¿Hay periodo de carencia?",
    answer:
      "Sí, la mayoría de nuestros planes tienen un breve periodo de carencia (normalmente 15 días para enfermedades y 3 días para accidentes) antes de que algunas coberturas estén activas. Esto se detalla en la documentación de tu póliza.",
  },
  {
    id: "faq4",
    question: "¿Cómo funciona el reembolso de gastos?",
    answer:
      "Para solicitar un reembolso, simplemente debes completar el formulario de reclamación en nuestra app o sitio web y adjuntar la factura detallada y el informe veterinario. Procesaremos tu solicitud lo más rápido posible, normalmente en menos de 5 días hábiles.",
  },
];

// --- Componentes Reutilizables con Efectos ---

const HoverButton = ({ onPress, style, children, activeOpacity = 0.8, hoverStyle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  };

  const animatedStyle = Platform.OS === 'web' ? { transform: [{ scale: scaleAnim }] } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      // @ts-ignore - Props web
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Animated.View style={[style, animatedStyle, isHovered && hoverStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const FadeInSection = ({ children, delay = 0, duration = 600, style: customStyle, useNativeDriver = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeDriver,
      }),
    ]).start();
  }, [fadeAnim, translateX, delay, duration, useNativeDriver]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateX }],
          width: "100%",
          alignItems: "center",
        },
        customStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    if (expanded) {
        Animated.timing(animatedHeight, {
          toValue: contentHeight > 0 ? contentHeight : 1000, // Usa contentHeight o un fallback grande
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Altura no es compatible con el driver nativo
        }).start();
    } else {
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start();
    }
  }, [expanded, rotateAnim, animatedHeight, contentHeight]);

  const toggle = () => {
    setExpanded(!expanded);
  };

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const measureContent = (event) => {
    const measuredHeight = event.nativeEvent.layout.height;
    if (measuredHeight > 0 && contentHeight !== measuredHeight) {
        setContentHeight(measuredHeight);
        // Si se expande y la altura medida es nueva, re-anima a la altura correcta
        if(expanded && animatedHeight._value !== measuredHeight) { // Acceso a _value es interno, pero útil aquí
            Animated.timing(animatedHeight, {
              toValue: measuredHeight,
              duration: 350, // Puede ser más corto si ya está expandiéndose
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }).start();
        }
    }
  };

  return (
    <View style={enhancedStyles.faqItem}>
      <TouchableOpacity onPress={toggle} style={enhancedStyles.faqHeader} activeOpacity={0.7}>
        <Text style={enhancedStyles.faqQuestion}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
          <MaterialIcons
            name={"keyboard-arrow-down"}
            size={28}
            color={theme.primaryColor}
          />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View
        style={[
          enhancedStyles.faqAnswerWrapperBase,
          { maxHeight: animatedHeight }, // Usa maxHeight para la animación de altura
        ]}
      >
        {/* Contenedor invisible para medir la altura real del contenido */}
        <View
          style={{ position: 'absolute', opacity: 0, top: 0, left: 0, right: 0, zIndex: -1 }}
          onLayout={measureContent}
          collapsable={false} // Importante para asegurar que onLayout se dispare consistentemente
        >
          <View style={enhancedStyles.faqAnswerContainerInner}>
            <Text style={enhancedStyles.faqAnswer}>{answer}</Text>
          </View>
        </View>
        {/* Contenedor visible que se anima */}
        <View style={enhancedStyles.faqAnswerContainerInner} >
          <Text style={enhancedStyles.faqAnswer}>{answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
};


const HoverCard = ({ children, style, hoverEffect = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleHover = (isHovering) => {
      if (Platform.OS === 'web' && hoverEffect) {
          setIsHovered(isHovering);
          Animated.spring(scaleAnim, {
            toValue: isHovering ? 1.03 : 1,
            friction: 5,
            useNativeDriver: true, // Scale es transform, compatible
          }).start();
      }
  };

  const animatedStyle = Platform.OS === 'web' && hoverEffect ? { transform: [{ scale: scaleAnim }] } : {};
  const shadowStyle = Platform.OS === 'web' && isHovered && hoverEffect ? theme.hoverShadow : theme.shadow;

  return (
    <Animated.View
      style={[enhancedStyles.cardBase, shadowStyle, animatedStyle, style]}
      // @ts-ignore - Props web
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      {children}
    </Animated.View>
  );
};


// --- Componentes de Sección ---

const HeroSection = React.forwardRef(({ onPressPlans }, ref) => {
  return (
    <View ref={ref} style={enhancedStyles.heroContainer}>
      <ImageBackground
        source={images.HERO}
        style={enhancedStyles.heroImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(38, 70, 83, 0.75)', 'rgba(38, 70, 83, 0.15)', 'transparent']}
          style={enhancedStyles.heroOverlay}
        >
          <View style={enhancedStyles.heroContent}>
            <FadeInSection delay={200} duration={800} useNativeDriver={Platform.OS !== 'web'}>
              <>
                <Text style={enhancedStyles.heroTitle}>
                  La Mejor Protección Para Tu Mascota
                </Text>
                <Text style={enhancedStyles.heroSubtitle}>
                  Cobertura veterinaria completa y cuidados expertos para tu
                  compañero más fiel. Descubre nuestros planes.
                </Text>
                <HoverButton
                  style={enhancedStyles.heroButton}
                  onPress={onPressPlans}
                  hoverStyle={enhancedStyles.buttonHoverPrimaryDarker}
                >
                  <Text style={enhancedStyles.heroButtonText}>Ver Planes</Text>
                  <FontAwesome5
                    name="arrow-right"
                    size={18}
                    color={theme.white}
                    style={{ marginLeft: 8 }}
                  />
                </HoverButton>
              </>
            </FadeInSection>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
});

const AboutUsSection = React.forwardRef((props, ref) => {
  const { isMobile } = props;
  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.offWhite }]}>
      <FadeInSection useNativeDriver={Platform.OS !== 'web'}
        style={{width: '100%', alignItems: 'center'}}
      >
        <View style={enhancedStyles.sectionContent}>
          <Text style={enhancedStyles.sectionTitle}>Quiénes Somos</Text>
          <Text style={[enhancedStyles.sectionText, typography.body]}>
            En PetCareSeguros llevamos más de 10 años dedicados al cuidado y
            protección de tus mascotas. Nuestro equipo de veterinarios expertos y
            amantes de los animales trabajan 24/7 para ofrecer la mejor cobertura y
            atención integral, porque sabemos que son parte de tu familia.
          </Text>
          <View style={[enhancedStyles.statsContainer, isMobile && { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }]}> 
            <View style={[enhancedStyles.statItem, isMobile && { alignItems: 'center', width: '100%' }]}> 
              <Text style={enhancedStyles.statNumber}>+50K</Text>
              <Text style={enhancedStyles.statLabel}>Mascotas Protegidas</Text>
            </View>
            <View style={[enhancedStyles.statItem, isMobile && { alignItems: 'center', width: '100%' }]}> 
              <Text style={enhancedStyles.statNumber}>98%</Text>
              <Text style={enhancedStyles.statLabel}>Satisfacción Clientes</Text>
            </View>
            <View style={[enhancedStyles.statItem, isMobile && { alignItems: 'center', width: '100%' }]}> 
              <Text style={enhancedStyles.statNumber}>24/7</Text>
              <Text style={enhancedStyles.statLabel}>Atención Veterinaria</Text>
            </View>
          </View>
        </View>
      </FadeInSection>
    </View>
  );
});

const StepCard = ({ step, index, isMobile }) => {
  return (
    <FadeInSection
      delay={index * 150}
      useNativeDriver={Platform.OS !== 'web'} // transform y opacity en web
      style={[enhancedStyles.stepCardWrapper, isMobile && { width: '98%', maxWidth: '98%' }]}
    >
      <HoverCard style={enhancedStyles.stepCard}>
        <View style={enhancedStyles.stepIconWrapper}>
          <MaterialCommunityIcons
            name={step.icon}
            size={40}
            color={theme.primaryColor}
          />
        </View>
        <Text style={enhancedStyles.stepTitle}>{step.title}</Text>
        <Text style={[ enhancedStyles.stepDescription, typography.body, { fontSize: 15 } ]}>
          {step.description}
        </Text>
      </HoverCard>
    </FadeInSection>
  );
};

const StepsSection = React.forwardRef((props, ref) => {
  const { isMobile } = props;
  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.greyLight }]}>
      <View style={enhancedStyles.sectionContent}>
        <FadeInSection delay={0} useNativeDriver={Platform.OS !== 'web'} style={{marginBottom: spacing.large, width: '100%', alignItems: 'center'}}>
            <Text style={enhancedStyles.sectionTitle}>¿Cómo Funciona?</Text>
        </FadeInSection>
        <View style={[enhancedStyles.stepsCardsContainer, isMobile && { flexDirection: 'column', alignItems: 'center' }]}> 
            {STEPS.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} isMobile={isMobile} />
            ))}
        </View>
      </View>
    </View>
  );
});

const PlanCard = ({ plan, onSelect, index, isMobile }) => {
  return (
    <FadeInSection
      delay={index * 150}
      useNativeDriver={Platform.OS !== 'web'}
      style={[enhancedStyles.planCardWrapper, isMobile && { width: '98%', maxWidth: '98%' }]}
    >
      <HoverCard
        style={[
          enhancedStyles.planCard,
          plan.recommended && enhancedStyles.recommendedPlanCardVisual,
        ]}
      >
        {plan.recommended && (
          <View style={enhancedStyles.recommendedBadge}>
            <Text style={enhancedStyles.recommendedBadgeText}>Recomendado</Text>
          </View>
        )}
        <View style={enhancedStyles.planHeader}>
          <MaterialCommunityIcons
            name={plan.icon}
            size={56}
            color={plan.recommended ? theme.accentColor : theme.primaryColor}
          />
          <Text style={enhancedStyles.planName}>{plan.name}</Text>
          <Text style={enhancedStyles.planPrice}>{plan.price}</Text>
        </View>
        <View style={enhancedStyles.planFeatures}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={enhancedStyles.planFeatureItem}>
              <MaterialIcons
                name="check-circle-outline"
                size={20}
                color={theme.primaryColor}
              />
              <Text style={[ enhancedStyles.planFeatureText, typography.body, { fontSize: 15, textAlign: 'left' } ]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        <HoverButton
          style={[
            enhancedStyles.planButton,
            plan.recommended && enhancedStyles.recommendedPlanButton,
          ]}
          hoverStyle={plan.recommended ? enhancedStyles.buttonHoverAccentDarker : enhancedStyles.buttonHoverPrimaryDarker}
          onPress={onSelect}
        >
          <Text style={[ enhancedStyles.planButtonText, plan.recommended && enhancedStyles.recommendedPlanButtonText ]}>
            Elegir Plan
          </Text>
        </HoverButton>
      </HoverCard>
    </FadeInSection>
  );
};


const PlansSection = React.forwardRef(({ onSelectPlan, isMobile }, ref) => {
  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.white }]}>
      <View style={enhancedStyles.sectionContent}>
          <FadeInSection delay={0} useNativeDriver={Platform.OS !== 'web'} style={{marginBottom: spacing.large, width: '100%', alignItems: 'center'}}>
            <Text style={enhancedStyles.sectionTitle}>Nuestros Planes</Text>
          </FadeInSection>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <MaterialCommunityIcons
              name="dog"
              size={200}
              color={theme.primaryColor}
              style={{ marginRight: 20 }}
            />
            <View style={[enhancedStyles.plansCardsContainer, isMobile && { flexDirection: 'column', alignItems: 'center' }]}> 
              {PLANS.map((plan, index) => (
                <PlanCard key={plan.id} plan={plan} onSelect={() => onSelectPlan(plan)} index={index} isMobile={isMobile} />
              ))}
            </View>
            <MaterialCommunityIcons
              name="cat"
              size={200}
              color={theme.primaryColor}
              style={{ marginLeft: 20 }}
            />
          </View>
      </View>
    </View>
  );
});

const TestimonialsSection = React.forwardRef((props, ref) => {
  const [currentGroup, setCurrentGroup] = useState(0);
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const testimonialsPerGroup = isMobile ? 1 : 3;
  const totalGroups = Math.ceil(TESTIMONIALS.length / testimonialsPerGroup);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGroup((prevGroup) => (prevGroup + 1) % totalGroups);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalGroups]);

  const getCurrentTestimonials = () => {
    const startIndex = currentGroup * testimonialsPerGroup;
    return TESTIMONIALS.slice(startIndex, startIndex + testimonialsPerGroup);
  };

  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.mutedPrimary }]}>
      <View style={enhancedStyles.sectionContent}>
        <FadeInSection delay={0} useNativeDriver={Platform.OS !== 'web'} style={{marginBottom: spacing.medium, width: '100%', alignItems: 'center'}}>
          <Text style={[enhancedStyles.sectionTitle, { color: theme.secondaryColor }]}>
            Opiniones de Clientes Satisfechos
          </Text>
        </FadeInSection>
        <View style={enhancedStyles.testimonialsContainer}>
          <Animated.View style={[
            enhancedStyles.testimonialsGroupContainer,
            isMobile && enhancedStyles.testimonialsGroupContainerMobile
          ]}>
            {getCurrentTestimonials().map((item, index) => (
              <FadeInSection
                key={item.id}
                delay={index * 200}
                duration={500}
                useNativeDriver={Platform.OS !== 'web'}
                style={[
                  enhancedStyles.testimonialCardWrapper,
                  isMobile && enhancedStyles.testimonialCardWrapperMobile
                ]}
              >
                <HoverCard style={enhancedStyles.testimonialCard}>
                  <MaterialCommunityIcons
                    name="format-quote-open"
                    size={40}
                    color={theme.primaryColor}
                    style={enhancedStyles.quoteIcon}
                  />
                  <Text style={[enhancedStyles.testimonialText, typography.body, { fontStyle: 'italic', fontSize: 16, textAlign: 'left' }]}>
                    {item.quote}
                  </Text>
                  <View style={enhancedStyles.testimonialAuthorContainer}>
                    <Text style={enhancedStyles.testimonialAuthor}>{item.author}</Text>
                    <Text style={enhancedStyles.testimonialPet}>{item.pet}</Text>
                  </View>
                </HoverCard>
              </FadeInSection>
            ))}
          </Animated.View>
          <View style={enhancedStyles.paginationContainer}>
            {Array.from({ length: totalGroups }).map((_, index) => (
              <View
                key={index}
                style={[
                  enhancedStyles.paginationDot,
                  index === currentGroup && enhancedStyles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
});

const CommunitySection = React.forwardRef((props, ref) => {
  const router = useRouter();
  const [currentGroup, setCurrentGroup] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const imagesPerGroup = isMobile ? 1 : 3;

  // Array de imágenes de animales
  const animalImages = [
    images.PERRO,
    images.PERRO2,
    images.LABRADOR,
    images.GATO,
    images.GATO1,
    images.GATO3,
    images.HAMSTER,
    images.HURON,
    images.TORTUGA,
  ];
  // Barajar el array de imágenes al cargar la sección
  const [galleryData] = useState(() => {
    const arr = [...animalImages];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const totalGroups = Math.ceil(galleryData.length / imagesPerGroup);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentGroup((prevGroup) => (prevGroup + 1) % totalGroups);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalGroups]);

  const getCurrentImages = () => {
    const startIndex = currentGroup * imagesPerGroup;
    return galleryData.slice(startIndex, startIndex + imagesPerGroup);
  };

  const handleJoinCommunity = () => {
    router.push('/presupuesto');
  };

  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.offWhite }]}>
      <View style={enhancedStyles.sectionContent}>
        <FadeInSection delay={0} useNativeDriver={Platform.OS !== 'web'} style={{marginBottom: spacing.medium, width: '100%', alignItems: 'center'}}>
          <Text style={enhancedStyles.sectionTitle}>Nuestra Comunidad</Text>
          <Text style={[enhancedStyles.sectionText, typography.body, { marginBottom: spacing.large }]}>
            Únete a miles de dueños que confían en nosotros. Comparte fotos de tus mascotas felices y protegidas.
          </Text>
        </FadeInSection>
        <View style={enhancedStyles.galleryContainer}>
          <Animated.View style={[
            enhancedStyles.galleryGroupContainer,
            isMobile && enhancedStyles.galleryGroupContainerMobile,
            {
              opacity: isTransitioning ? 0 : 1,
              transform: [{ scale: isTransitioning ? 0.95 : 1 }],
            }
          ]}>
            {getCurrentImages().map((imgSrc, index) => (
              <View
                key={index}
                style={[
                  enhancedStyles.galleryItemWrapper,
                  isMobile && enhancedStyles.galleryItemWrapperMobile
                ]}
              >
                <HoverCard style={enhancedStyles.galleryItem} hoverEffect={false}>
                  <Image
                    source={imgSrc}
                    style={enhancedStyles.galleryImage}
                    resizeMode="cover"
                  />
                </HoverCard>
              </View>
            ))}
          </Animated.View>
          <View style={enhancedStyles.paginationContainer}>
            {Array.from({ length: totalGroups }).map((_, index) => (
              <View
                key={index}
                style={[
                  enhancedStyles.paginationDot,
                  index === currentGroup && enhancedStyles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>
        <FadeInSection delay={100} useNativeDriver={Platform.OS !== 'web'} style={{marginTop: spacing.large, alignItems: 'center'}}>
          <HoverButton
            style={enhancedStyles.communityButton}
            hoverStyle={enhancedStyles.buttonHoverPrimaryDarker}
            onPress={handleJoinCommunity}
          >
            <Text style={enhancedStyles.communityButtonText}>
              ¡Únete a la Comunidad!
            </Text>
            <MaterialIcons name="group-add" size={20} color={theme.white} style={{ marginLeft: 8 }} />
          </HoverButton>
        </FadeInSection>
      </View>
    </View>
  );
});

const FAQSection = React.forwardRef((props, ref) => {
  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.greyLight }]}>
      <View style={enhancedStyles.sectionContent}>
        <FadeInSection delay={0} useNativeDriver={Platform.OS !== 'web'} style={{marginBottom: spacing.medium, width: '100%', alignItems: 'center'}}>
            <Text style={enhancedStyles.sectionTitle}>Preguntas Frecuentes (FAQ)</Text>
        </FadeInSection>
        <View style={enhancedStyles.faqContainer}>
          {FAQS.map((faq, index) => (
            <FadeInSection
              key={faq.id}
              delay={index * 100}
              useNativeDriver={false} // Opacity y transform (translateY) sí, pero height en FAQItem no.
              style={{ width: '100%', alignItems: 'center', marginBottom: spacing.medium }}
            >
              <FAQItem question={faq.question} answer={faq.answer} />
            </FadeInSection>
          ))}
        </View>
      </View>
    </View>
  );
});


const ProtectPetCTASection = React.forwardRef((props, ref) => {
  const router = useRouter();
  const { isMobile } = props;

  const handleHireNow = () => {
    router.push('/presupuesto');
  };

  const handleContactAdvisor = () => {
    const phoneNumber = '34667995328';
    const message = '¡Hola! Me gustaría hablar con un asesor sobre los seguros de mascotas de PetCareSeguros. Necesito ayuda para elegir el mejor plan para mi compañero peludo';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  return (
    <View ref={ref} style={[enhancedStyles.section, { backgroundColor: theme.primaryColor }]}>
      <View style={enhancedStyles.sectionContent}>
        <FadeInSection useNativeDriver={Platform.OS !== 'web'} style={{width: '100%', alignItems: 'center'}}>
          <Text style={enhancedStyles.protectPetCtaTitle}>
            ¿Listo para Proteger a tu Mejor Amigo?
          </Text>
          <Text style={enhancedStyles.protectPetCtaSubtitle}>
            Únete hoy a PetCareSeguros y dale a tu mascota la seguridad y el cuidado que se merece.
            Contratación rápida y sencilla.
          </Text>
          <View style={[enhancedStyles.protectPetCtaButtonsContainer, isMobile && { flexDirection: 'column', width: '100%' }]}>
            <HoverButton
              style={[enhancedStyles.protectPetCtaButton, enhancedStyles.protectPetCtaButtonPrimary]}
              hoverStyle={enhancedStyles.buttonHoverWhiteDarker}
              onPress={handleHireNow}
            >
              <Text style={enhancedStyles.protectPetCtaButtonText}>Obtener Presupuesto</Text>
              <MaterialIcons name="pets" size={20} color={theme.primaryColor} style={{ marginLeft: 8 }}/>
            </HoverButton>
            <HoverButton
              style={[enhancedStyles.protectPetCtaButton, enhancedStyles.protectPetCtaButtonSecondary]}
              hoverStyle={enhancedStyles.buttonHoverOutlineWhiteFill}
              onPress={handleContactAdvisor}
            >
              <Text style={[enhancedStyles.protectPetCtaButtonText, enhancedStyles.protectPetCtaButtonSecondaryText]}>Hablar con un Asesor</Text>
              <MaterialIcons name="support-agent" size={20} color={theme.white} style={{ marginLeft: 8 }}/>
            </HoverButton>
          </View>
        </FadeInSection>
      </View>
    </View>
  );
});

const FooterLink = ({ onPress, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const handleMouseEnter = () => Platform.OS === 'web' && setIsHovered(true);
    const handleMouseLeave = () => Platform.OS === 'web' && setIsHovered(false);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            // @ts-ignore - Props web
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ paddingVertical: spacing.small / 2 }}
        >
            <Text style={[enhancedStyles.footerLink, isHovered && enhancedStyles.footerLinkHover]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

const Footer = React.forwardRef((props, ref) => (
  <View ref={ref} style={[enhancedStyles.footerBase, { backgroundColor: theme.secondaryColor }]}>
    <View style={enhancedStyles.footerContent}>
      <View style={enhancedStyles.footerColumn}>
        <Text style={enhancedStyles.footerTitle}>🐾 PetCareSeguros</Text>
        <Text style={enhancedStyles.footerText}>
          Protección y tranquilidad para ti y tu mascota. Cuidado experto al alcance de tu mano.
        </Text>
      </View>
      <View style={enhancedStyles.footerColumn}>
        <Text style={enhancedStyles.footerTitle}>Navegación</Text>
        <FooterLink onPress={() => props.onNavigateToPlans && props.onNavigateToPlans()}>Planes</FooterLink>
        <FooterLink onPress={() => props.onNavigateToAbout && props.onNavigateToAbout()}>Sobre Nosotros</FooterLink>
        <FooterLink onPress={() => props.onNavigateToServices && props.onNavigateToServices()}>Servicios</FooterLink>
        <FooterLink onPress={() => props.onNavigateToContact && props.onNavigateToContact()}>Contacto</FooterLink>
      </View>
      <View style={enhancedStyles.footerColumn}>
        <Text style={enhancedStyles.footerTitle}>Legal</Text>
        <FooterLink onPress={() => console.log("T&C footer pressed")}>Términos y Condiciones</FooterLink>
        <FooterLink onPress={() => console.log("Privacy footer pressed")}>Política de Privacidad</FooterLink>
        <FooterLink onPress={() => console.log("Cookies footer pressed")}>Política de Cookies</FooterLink>
      </View>
      <View style={enhancedStyles.footerColumn}>
        <Text style={enhancedStyles.footerTitle}>Contacto</Text>
        <Text style={enhancedStyles.footerText}>📧 info@petcareseguros.com</Text>
        <Text style={enhancedStyles.footerText}>📞 +34 900 123 456</Text>
        <Text style={enhancedStyles.footerText}>📍 Calle Falsa 123, Madrid</Text>
        <Text style={enhancedStyles.footerText}>⏰ Lu-Vi: 9:00 - 20:00</Text>
      </View>
    </View>
    <View style={enhancedStyles.copyrightContainer}>
        <Text style={enhancedStyles.copyright}>
        © {new Date().getFullYear()} PetCareSeguros S.L. Todos los derechos reservados.
        </Text>
    </View>
  </View>
));


// --- Estilos Mejorados ---
// Nota: `useNativeDriver` para Animated:
// - opacity: true
// - transform (scale, translate): true
// - height, width, top, left, etc. (layout props): false (en web a veces funciona, pero en nativo no)
const enhancedStyles = StyleSheet.create({
  container: {
      flex: 1,
  },
  cardBase: {
    borderRadius: borderRadius.large,
    backgroundColor: theme.white,
  },
  // --- Hero Section ---
  heroContainer: {
    minHeight: heroHeight,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.secondaryColor, // Fallback
  },
  heroImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.large,
  },
  heroContent: {
    maxWidth: 750,
    alignItems: "center",
    padding: spacing.medium,
    borderRadius: borderRadius.large,
  },
  heroTitle: {
    ...typography.heading1,
    color: theme.white,
    marginBottom: spacing.medium,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 5,
  },
  heroSubtitle: {
    ...typography.body,
    fontSize: Platform.OS === "web" ? 20 : 18,
    color: theme.white,
    marginBottom: spacing.extraLarge,
    lineHeight: 30,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    maxWidth: 650,
  },
  heroButton: {
    backgroundColor: theme.primaryColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.medium + 2,
    paddingHorizontal: spacing.large + 5,
    borderRadius: 50,
    ...theme.shadow,
    shadowColor: theme.primaryColor,
    shadowOpacity: 0.3,
  },
  heroButtonText: {
    ...typography.button,
    fontSize: 18,
  },
  buttonHoverPrimaryDarker: {
    backgroundColor: '#208A8A', // Un poco más oscuro que primaryColor
  },
  buttonHoverAccentDarker: {
    backgroundColor: '#D4A03A', // Un poco más oscuro que accentColor
  },
  buttonHoverWhiteDarker: {
    backgroundColor: theme.greyLight, // Blanco se vuelve gris claro
  },
  buttonHoverOutlineWhiteFill: { // Para botones con borde blanco y fondo transparente
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Un relleno blanco sutil
    borderColor: theme.white, // Mantener el borde blanco si ya lo tenía
  },

  section: {
    paddingVertical: spacing.ultraLarge,
    width: "100%",
    alignItems: "center",
    overflow: 'hidden', // Para evitar que las animaciones de FadeInSection se vean antes de tiempo
  },
  sectionContent: {
    width: "100%",
    maxWidth: maxWidth,
    paddingHorizontal: spacing.large,
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.heading2,
    marginBottom: spacing.large,
    color: theme.secondaryColor,
  },
  sectionText: {
    ...typography.body,
    maxWidth: 800,
    marginBottom: spacing.medium,
    textAlign: "center",
    color: theme.dark,
  },

  // --- Sección "Cómo Funciona" (Steps) ---
  stepsCardsContainer: {
      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
      justifyContent: 'center',
      alignItems: Platform.OS === 'web' ? 'stretch' : 'center',
      flexWrap: 'wrap',
      width: '100%',
      gap: spacing.large,
  },
  stepCardWrapper: {
      width: Platform.OS === 'web' ? '30%' : '98%', // Más ancho en móvil
      maxWidth: Platform.OS === 'web' ? 340 : '98%', // Ocupa casi todo el ancho en móvil
      alignItems: 'stretch',
      marginBottom: Platform.OS === 'web' ? 0 : spacing.large,
  },
  stepCard: {
    padding: spacing.large,
    flex: 1, // Para que todas las tarjetas en una fila tengan la misma altura (en web con flexDirection: row)
    minHeight: Platform.OS === "web" ? 240 : 220,
    alignItems: "center", // Centrar contenido de la tarjeta
    justifyContent: "flex-start", // Alinear contenido al inicio
  },
  stepIconWrapper: {
    backgroundColor: theme.primaryColor + "1A", // Verde primario con baja opacidad
    borderRadius: 50, // Círculo perfecto
    padding: spacing.medium + 4,
    marginBottom: spacing.medium,
  },
  stepTitle: {
    ...typography.heading3,
    fontSize: 20, // Ligeramente más pequeño que heading3 por defecto
    marginTop: spacing.small,
    marginBottom: spacing.small,
    color: theme.secondaryColor,
  },
  stepDescription: {
    lineHeight: 22,
    color: theme.dark,
  },

  // --- Sección "Planes" ---
  plansCardsContainer: {
      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
      justifyContent: 'center',
      alignItems: Platform.OS === 'web' ? 'stretch' : 'center',
      flexWrap: 'wrap',
      width: '100%',
      gap: spacing.large,
  },
  planCardWrapper: {
      width: Platform.OS === 'web' ? '30%' : '98%', // Más ancho en móvil
      maxWidth: Platform.OS === 'web' ? 380 : '98%', // Ocupa casi todo el ancho en móvil
      alignItems: 'stretch',
      marginBottom: Platform.OS === 'web' ? 0 : spacing.large,
  },
  planCard: {
    flex: 1, // Para igualar alturas en web
    minHeight: 500, // Altura mínima para dar espacio a las características
    padding: spacing.large,
    display: "flex", // Habilitar flexbox para la tarjeta interna
    flexDirection: "column", // Organizar contenido verticalmente
    justifyContent: 'space-between', // Distribuir espacio, empujando el botón hacia abajo
  },
  recommendedPlanCardVisual: {
    borderColor: theme.accentColor, // Borde destacado para el plan recomendado
    borderWidth: 3,
    position: 'relative', // Para posicionar el badge correctamente
  },
  recommendedBadge: {
    position: "absolute",
    top: spacing.medium,
    right: spacing.medium,
    backgroundColor: theme.accentColor,
    paddingVertical: spacing.small / 2 + 1,
    paddingHorizontal: spacing.small + 2,
    borderRadius: borderRadius.small,
    zIndex: 1, // Para que esté encima del borde de la tarjeta
    ...theme.shadow, // Sombra sutil para el badge
  },
  recommendedBadgeText: {
    ...typography.caption,
    color: theme.secondaryColor, // Texto oscuro sobre fondo de acento
    fontWeight: "bold",
    fontSize: 12,
  },
  planHeader: {
    alignItems: "center", // Centrar ícono, nombre y precio
    marginBottom: spacing.medium,
  },
  planName: {
    ...typography.heading3,
    marginTop: spacing.medium,
    color: theme.secondaryColor,
    fontSize: 22, // Tamaño específico para el nombre del plan
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.primaryColor,
    marginTop: spacing.small,
  },
  planFeatures: {
    marginVertical: spacing.medium, // Espacio alrededor de la lista de características
  },
  planFeatureItem: {
    flexDirection: "row", // Alinear ícono de check y texto
    alignItems: "center", // Centrar verticalmente
    marginBottom: spacing.medium,
  },
  planFeatureText: {
    marginLeft: spacing.medium, // Espacio después del ícono
    flexShrink: 1, // Permitir que el texto se ajuste si es largo
    lineHeight: 24,
    color: theme.dark,
  },
  planButton: {
    backgroundColor: theme.primaryColor,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: "center",
    marginTop: "auto", // Empujar el botón al final de la tarjeta (si planFeatures no ocupa todo)
  },
  recommendedPlanButton: {
    backgroundColor: theme.accentColor, // Botón destacado para plan recomendado
  },
  planButtonText: {
    ...typography.button, // Estilo base de texto de botón
    fontSize: 16,
  },
  recommendedPlanButtonText: {
    color: theme.secondaryColor, // Texto oscuro sobre fondo de acento
    fontWeight: "bold",
  },

  // --- Sección Testimonios ---
  testimonialsContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  testimonialsGroupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: spacing.large,
    paddingHorizontal: spacing.large,
  },
  testimonialsGroupContainerMobile: {
    flexDirection: 'column',
    gap: spacing.medium,
    paddingHorizontal: spacing.medium,
  },
  testimonialCardWrapper: {
    width: Platform.OS === 'web' ? '30%' : '90%',
    maxWidth: 380,
    alignItems: 'stretch',
    height: 320,
  },
  testimonialCardWrapperMobile: {
    width: '100%',
    maxWidth: '100%',
    height: 320, // Aumentado para dar más espacio
  },
  testimonialCard: {
    backgroundColor: theme.white,
    padding: spacing.large,
    flex: 1,
    justifyContent: "space-between",
    borderRadius: theme.borderRadius,
    ...theme.shadow,
  },
  quoteIcon: {
    marginBottom: spacing.medium,
    alignSelf: "flex-start", // Alinear ícono de comillas a la izquierda
    color: theme.primaryColor,
  },
  testimonialText: {
    flex: 1,
    marginVertical: spacing.medium,
    lineHeight: 24,
    fontSize: Platform.OS === 'web' ? 16 : 15, // Texto ligeramente más pequeño en móvil
  },
  testimonialAuthorContainer: {
    marginTop: 'auto',
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: theme.greyLight,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimonialAuthor: {
    ...typography.body,
    fontWeight: "bold",
    color: theme.secondaryColor,
    textAlign: 'left',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    marginRight: spacing.small,
  },
  testimonialPet: {
    ...typography.caption,
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: theme.greyMedium,
    textAlign: 'left',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.large,
    gap: spacing.small,
    paddingVertical: spacing.small,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.greyLight,
    opacity: 0.5,
    margin: 2,
  },
  paginationDotActive: {
    backgroundColor: theme.primaryColor,
    opacity: 1,
    transform: [{ scale: 1.2 }],
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // --- Sección Comunidad (Galería) ---
  galleryContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  galleryGroupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: spacing.large,
    paddingHorizontal: spacing.large,
    transition: 'all 0.5s ease-in-out',
  },
  galleryGroupContainerMobile: {
    flexDirection: 'column',
    gap: spacing.medium,
    paddingHorizontal: spacing.medium,
  },
  galleryItemWrapper: {
    width: Platform.OS === 'web' ? '30%' : '90%',
    maxWidth: 380,
    height: 240,
    alignItems: 'stretch',
  },
  galleryItemWrapperMobile: {
    width: '100%',
    maxWidth: '100%',
    height: 200,
  },
  galleryItem: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
    ...theme.shadow,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  communityButton: {
    backgroundColor: theme.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 50, // Botón redondeado
    alignSelf: "center", // Centrar el botón
    marginTop: spacing.large + 10,
    ...theme.shadow,
  },
  communityButtonText: {
    ...typography.button,
    fontSize: 17,
  },

  // --- Sección FAQ ---
  faqContainer: {
    marginTop: spacing.medium,
    width: "100%",
    maxWidth: 850, // Ancho máximo para el contenedor de FAQs
    alignSelf: "center",
  },
  faqItem: {
    backgroundColor: theme.white,
    borderRadius: borderRadius.medium,
    ...theme.shadow,
    overflow: "hidden", // Importante para la animación de altura
    width: '100%',
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.large,
    cursor: Platform.OS === "web" ? "pointer" : undefined, // Cursor de puntero en web
  },
  faqQuestion: {
    ...typography.body,
    fontWeight: "600",
    color: theme.secondaryColor,
    flex: 1, // Para que la pregunta ocupe el espacio disponible
    marginRight: spacing.medium,
    textAlign: "left",
    fontSize: 18,
  },
  faqAnswerWrapperBase: { // Contenedor base para la animación de altura
    overflow: "hidden",
    backgroundColor: theme.white, // Asegurar que el fondo sea blanco
  },
  faqAnswerContainerInner: { // Contenedor interno para el padding de la respuesta
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
    paddingTop: spacing.medium, // Menos padding superior para que no se vea tan separado de la línea
    borderTopWidth: 1, // Línea separadora
    borderTopColor: theme.greyLight,
  },
  faqAnswer: {
    ...typography.body,
    color: theme.dark,
    textAlign: "left",
    lineHeight: 24,
    fontSize: 16,
  },

  // --- Sección CTA (Call to Action) ---
  protectPetCtaContent: {
    width: "100%",
    maxWidth: maxWidth,
    paddingHorizontal: spacing.large,
    alignItems: "center",
    justifyContent: "center",
  },
  protectPetCtaTitle: {
    ...typography.heading2,
    color: theme.white,
    marginBottom: spacing.medium,
    fontSize: Platform.OS === 'web' ? 32 : 28,
    textAlign: "center",
  },
  protectPetCtaSubtitle: {
    ...typography.body,
    color: theme.white,
    maxWidth: 650,
    marginBottom: spacing.large + 10,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 28,
  },
  protectPetCtaButtonsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.medium,
    width: '100%',
    marginTop: spacing.large,
  },
  protectPetCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 50,
    width: Platform.OS === 'web' ? 'auto' : '90%',
    ...theme.shadow,
  },
  protectPetCtaButtonPrimary: {
    backgroundColor: theme.white, // Botón primario con fondo blanco
  },
  protectPetCtaButtonText: {
    ...typography.button,
    color: theme.primaryColor, // Texto color primario sobre fondo blanco
    fontSize: 17,
  },
  protectPetCtaButtonSecondary: {
    backgroundColor: "transparent", // Botón secundario transparente
    borderColor: theme.white, // Borde blanco
    borderWidth: 2,
  },
  protectPetCtaButtonSecondaryText: {
    color: theme.white, // Texto blanco para botón secundario
  },

  // --- Sección Estadísticas (dentro de "Quiénes Somos") ---
  statsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: "space-around", // Distribuir espacio
    marginTop: spacing.large + 10,
    width: "100%",
    maxWidth: 800,
    flexWrap: "wrap", // Permitir que los items pasen a la siguiente línea
    gap: spacing.medium,
  },
  statItem: {
    alignItems: "center", // Centrar número y etiqueta
    marginBottom: spacing.medium,
    minWidth: Platform.OS === "web" ? 150 : '80%',
    width: Platform.OS === "web" ? undefined : '100%',
    padding: spacing.small,
  },
  statNumber: {
    fontSize: Platform.OS === "web" ? 36 : 32,
    fontWeight: "bold",
    color: theme.primaryColor,
    marginBottom: spacing.small / 2,
  },
  statLabel: {
    ...typography.caption,
    color: theme.secondaryColor,
    fontSize: 15,
    textAlign: 'center',
  },

  // --- Footer ---
  footerBase: {
    paddingTop: spacing.ultraLarge,
    paddingBottom: spacing.medium,
    width: "100%",
    alignItems: "center",
  },
  footerContent: {
    width: "100%",
    maxWidth: maxWidth,
    paddingHorizontal: spacing.large,
    flexDirection: "row", // Columnas en fila
    justifyContent: "space-between", // Distribuir espacio entre columnas
    flexWrap: "wrap", // Permitir que las columnas pasen a la siguiente línea
    alignItems: "flex-start", // Alinear columnas al inicio
    gap: spacing.medium, // Espacio entre columnas
    marginBottom: spacing.large,
  },
  footerColumn: {
    alignItems: "flex-start", // Alinear contenido de la columna a la izquierda
    minWidth: Platform.OS === "web" ? 220 : "45%", // Ancho mínimo, dos columnas en móvil
    flexGrow: 1, // Permitir que las columnas crezcan
    flexBasis: Platform.OS === "web" ? 220 : "45%", // Base para el crecimiento
    paddingHorizontal: spacing.small,
    marginBottom: spacing.medium,
  },
  footerTitle: {
    ...typography.heading3,
    fontSize: 19,
    color: theme.white, // Texto blanco sobre fondo oscuro del footer
    marginBottom: spacing.medium,
    textAlign: "left",
  },
  footerText: {
    ...typography.body,
    fontSize: 15,
    color: theme.greyLight, // Texto gris claro
    marginBottom: spacing.small,
    textAlign: "left",
    lineHeight: 24,
  },
  footerLink: {
    ...typography.body,
    fontSize: 15,
    color: theme.white,
    marginBottom: spacing.small,
    textAlign: "left",
    opacity: 0.85, // Ligeramente transparente
    fontWeight: '500',
    ...(Platform.OS === 'web' && { transition: 'opacity 0.2s ease-in-out, color 0.2s ease-in-out' }),
  },
  footerLinkHover: { // Efecto hover para enlaces del footer en web
      opacity: 1,
      color: theme.primaryColor, // Cambiar color al primario en hover
  },
  copyrightContainer: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)', // Línea separadora sutil
      paddingTop: spacing.large,
      paddingBottom: spacing.medium,
      marginTop: spacing.medium,
      alignItems: 'center',
  },
  copyright: {
    ...typography.caption,
    fontSize: 14,
    color: theme.greyMedium,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: spacing.large,
    opacity: 0.9,
  },
});

// --- Componente Principal de la Página ---
export default function IndexPage() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  const heroSectionRef = useRef(null);
  const aboutUsSectionRef = useRef(null); // ID: about
  const stepsSectionRef = useRef(null); // ID: steps (o services)
  const plansSectionRef = useRef(null); // ID: plans
  const testimonialsSectionRef = useRef(null);
  const communitySectionRef = useRef(null);
  const faqSectionRef = useRef(null);
  const contactSectionRef = useRef(null); // ID: contact (footer)

  const { userData } = useAuth();

  const scrollToSection = (ref) => {
    if (ref.current) {
      const node = ref.current;
      const scrollResponder = scrollViewRef.current?.getScrollResponder?.();

      if (Platform.OS === 'web') {
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback si scrollIntoView no está disponible (poco probable para elementos de View)
          if (node && typeof node.measure === 'function' && scrollResponder) {
            node.measure((_fx, _fy, _width, _height, _px, py) => {
              scrollResponder.scrollTo({ y: py, animated: true });
            });
          }
        }
      } else { // Móvil
        if (node && typeof node.measureLayout === 'function' && scrollResponder) {
          const ancestor = findNodeHandle(scrollViewRef.current);
          if (ancestor) {
            node.measureLayout(
              ancestor,
              (x, y) => {
                const headerOffset = 80; // Ajusta este valor según la altura de tu Header
                scrollResponder.scrollTo({ y: y - headerOffset > 0 ? y - headerOffset : y, animated: true });
              },
              () => { console.error('Native scroll: Failed to measure layout.'); }
            );
          }
        }
      }
    }
  };

  const handleScrollToHome = () => {
    // @ts-ignore
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  const handleScrollToPlans = () => scrollToSection(plansSectionRef);
  const handleScrollToAbout = () => scrollToSection(aboutUsSectionRef);
  const handleScrollToServices = () => scrollToSection(stepsSectionRef); // Asumiendo que Steps es Servicios
  const handleScrollToContact = () => scrollToSection(contactSectionRef); // Footer es Contacto

  const handleSelectPlan = (plan) => {
    // Cambiado para redirigir a /presupuesto en lugar de /registro
    router.push({ pathname: "/presupuesto", params: { selectedPlan: plan.name, planId: plan.id } });
    // console.log(`Plan seleccionado: ${plan.name}, redirigiendo a presupuesto.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.white }}>
      <Header
        onNavigateToHome={handleScrollToHome}
        onNavigateToPlans={handleScrollToPlans}
        onNavigateToServices={handleScrollToServices} // Asumiendo que Steps es Servicios
        onNavigateToAbout={handleScrollToAbout}
        onNavigateToContact={handleScrollToContact} // Footer es Contacto
        // Ya no es necesario onPressLogin ni onPressSignup si Header los maneja internamente con router
      />
      <ScrollView
        ref={scrollViewRef}
        style={enhancedStyles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 0 }} // Asegurar que no haya padding extra al final
        scrollEventThrottle={16} // Para animaciones basadas en scroll si las hubiera
      >
        <HeroSection ref={heroSectionRef} onPressPlans={handleScrollToPlans} />
        <AboutUsSection ref={aboutUsSectionRef} isMobile={isMobile} />
        <StepsSection ref={stepsSectionRef} isMobile={isMobile} />
        <PlansSection ref={plansSectionRef} onSelectPlan={handleSelectPlan} isMobile={isMobile} />
        <TestimonialsSection ref={testimonialsSectionRef} />
        <CommunitySection ref={communitySectionRef} />
        <FAQSection ref={faqSectionRef} />
        <ProtectPetCTASection ref={contactSectionRef} isMobile={isMobile} />
        <Footer
          ref={contactSectionRef} // El ref para la sección de contacto es el Footer
          onNavigateToPlans={handleScrollToPlans}
          onNavigateToAbout={handleScrollToAbout}
          onNavigateToServices={handleScrollToServices}
          onNavigateToContact={handleScrollToContact} 
        />
      </ScrollView>
    </View>
  );
}