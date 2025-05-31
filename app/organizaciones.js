"use client";

import React, { useRef, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Platform,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import Footer from '../components/Footer';

// --- Paleta de Colores ---
const theme = {
  primaryColor: "#2A9D8F",
  secondaryColor: "#264653",
  accentColor: "#E9C46A",
  mutedPrimary: "#A8DADC",
  offWhite: '#FAF7F2',
  white: "#FFFFFF",
  greyLight: "#E9ECEF",
  dark: "#343a40",
  greyMedium: "#6c757d",
  borderRadius: 10,
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    },
  }),
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
};

// --- Espaciado ---
const spacing = {
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
  ultraLarge: 48,
};

// --- Datos de Organizaciones ---
const ORGANIZACIONES = [
  {
    id: "1",
    nombre: "Fundación Affinity",
    descripcion: "Dedicada a mejorar la calidad de vida de los animales de compañía y sus familias. Promueven la adopción responsable y la investigación en bienestar animal.",
    color: "#FFD700",
    web: "https://www.fundacion-affinity.org",
    icon: "pets",
    imagen: require('../assets/images/affiniti.png'),
  },
  {
    id: "2",
    nombre: "WWF España",
    descripcion: "Organización líder en conservación de la naturaleza. Trabajan para proteger especies en peligro y sus hábitats naturales.",
    color: "#228B22",
    web: "https://www.wwf.es",
    icon: "eco",
    imagen: require('../assets/images/wwf.png'),
  },
  {
    id: "3",
    nombre: "ANAA",
    descripcion: "Asociación Nacional Amigos de los Animales. Rescatan y protegen animales abandonados, promoviendo su adopción responsable.",
    color: "#FF6B6B",
    web: "https://www.anaaweb.org",
    icon: "favorite",
    imagen: require('../assets/images/anaa.jpg'),
  },
  {
    id: "4",
    nombre: "SEO/BirdLife",
    descripcion: "Sociedad Española de Ornitología. Protegen las aves y sus hábitats, promoviendo la conservación de la biodiversidad.",
    color: "#4A90E2",
    web: "https://www.seo.org",
    icon: "cloud",
    imagen: require('../assets/images/seo.png'),
  },
  {
    id: "5",
    nombre: "FAADA",
    descripcion: "Fundación para el Asesoramiento y Acción en Defensa de los Animales. Luchan contra el maltrato animal y promueven su bienestar.",
    color: "#9B59B6",
    web: "https://www.faada.org",
    icon: "description",
    imagen: require('../assets/images/faada.jpg'),
  },
  {
    id: "6",
    nombre: "APDDA",
    descripcion: "Asociación Parlamentaria en Defensa de los Derechos de los Animales. Trabajan para mejorar la legislación y protección de los animales en España.",
    color: "#E67E22",
    web: "https://www.apdda.es",
    icon: "gavel",
    imagen: require('../assets/images/apdda.jpg'),
  },
];

// --- Componentes Reutilizables ---
const FadeInSection = ({ children, delay = 0, duration = 600, style: customStyle, useNativeDriver = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeDriver,
      }),
    ]).start();
  }, [fadeAnim, translateY, delay, duration, useNativeDriver]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Animated.View style={[style, animatedStyle, isHovered && hoverStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const OrganizationCard = ({ organization, index, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      Animated.spring(scaleAnim, {
        toValue: 1.03,
        friction: 5,
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
    <FadeInSection
      delay={index * 150}
      useNativeDriver={Platform.OS !== 'web'}
      style={[styles.organizationCardWrapper, isMobile && { width: '98%', maxWidth: '98%' }]}
    >
      <Animated.View
        style={[styles.organizationCard, animatedStyle, isHovered && styles.organizationCardHover]}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <View style={[styles.organizationImageContainer, { backgroundColor: organization.color }]}>
          <Image
            source={organization.imagen}
            style={styles.organizationImageUnified}
            resizeMode="contain"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
        </View>
        <View style={styles.organizationContent}>
          <View style={styles.organizationIconContainer}>
            <MaterialIcons name={organization.icon} size={32} color={theme.primaryColor} />
          </View>
          <Text style={styles.organizationTitle}>{organization.nombre}</Text>
          <Text style={styles.organizationDescription}>{organization.descripcion}</Text>
          <HoverButton
            style={styles.organizationButton}
            hoverStyle={styles.organizationButtonHover}
            onPress={() => window.open(organization.web, '_blank')}
          >
            <Text style={styles.organizationButtonText}>Visitar Web</Text>
            <MaterialIcons name="arrow-forward" size={20} color={theme.white} style={{ marginLeft: 8 }} />
          </HoverButton>
        </View>
      </Animated.View>
    </FadeInSection>
  );
};

// --- Componente Principal ---
export default function OrganizacionesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  return (
    <View style={{ flex: 1, backgroundColor: theme.white }}>
      <Header />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center" }}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[theme.primaryColor, theme.secondaryColor]}
            style={styles.heroGradient}
          >
            <FadeInSection delay={200} duration={800}>
              <Text style={styles.heroTitle}>
                Organizaciones Colaboradoras
              </Text>
              <Text style={styles.heroSubtitle}>
                Descubre las organizaciones que trabajan por el bienestar animal
                y únete a su causa.
              </Text>
            </FadeInSection>
          </LinearGradient>
        </View>

        <View style={styles.organizationsSection}>
          <View style={styles.sectionContent}>
            <FadeInSection delay={0} useNativeDriver={Platform.OS !== 'web'} style={{marginBottom: spacing.large, width: '100%', alignItems: 'center'}}>
              <Text style={styles.sectionTitle}>Nuestros Colaboradores</Text>
              <Text style={styles.sectionSubtitle}>
                Estas organizaciones comparten nuestra visión de un mundo mejor para los animales.
                Conoce su trabajo y cómo puedes ayudar.
              </Text>
            </FadeInSection>

            <View style={[styles.organizationsGrid, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
              {ORGANIZACIONES.map((org, index) => (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  index={index}
                  isMobile={isMobile}
                />
              ))}
            </View>
          </View>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    width: '100%',
    height: Platform.OS === 'web' ? '50vh' : 300,
    position: 'relative',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  heroTitle: {
    ...typography.heading1,
    color: theme.white,
    marginBottom: spacing.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    ...typography.body,
    color: theme.white,
    textAlign: 'center',
    maxWidth: 800,
    fontSize: Platform.OS === 'web' ? 20 : 18,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  organizationsSection: {
    width: '100%',
    paddingVertical: spacing.ultraLarge,
    backgroundColor: theme.offWhite,
    display: 'flex',
    alignItems: 'center',
  },
  sectionContent: {
    width: '100%',
    maxWidth: 1400,
    paddingHorizontal: spacing.large,
    alignItems: 'center',
    display: 'flex',
  },
  sectionTitle: {
    ...typography.heading2,
    marginBottom: spacing.medium,
  },
  sectionSubtitle: {
    ...typography.body,
    maxWidth: 800,
    marginBottom: spacing.large,
    color: theme.greyMedium,
  },
  organizationsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.large,
    width: '100%',
    paddingHorizontal: spacing.large,
    maxWidth: 1400,
  },
  organizationCardWrapper: {
    width: Platform.OS === 'web' ? '30%' : '100%',
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
    minWidth: Platform.OS === 'web' ? 350 : '100%',
    marginBottom: spacing.large,
  },
  organizationCard: {
    backgroundColor: theme.white,
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
    ...theme.shadow,
    height: 500, // Altura fija para todas las tarjetas
  },
  organizationCardHover: {
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
    }),
  },
  organizationImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  organizationImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  organizationImageUnified: {
    width: '80%',
    height: '80%',
    objectFit: 'contain',
    alignSelf: 'center',
    marginTop: '10%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  organizationContent: {
    padding: spacing.large,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  organizationIconContainer: {
    backgroundColor: theme.mutedPrimary,
    borderRadius: 50,
    padding: spacing.medium,
    marginTop: -40,
    marginBottom: spacing.medium,
  },
  organizationTitle: {
    ...typography.heading3,
    marginBottom: spacing.small,
  },
  organizationDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.large,
    color: theme.greyMedium,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizationButton: {
    backgroundColor: theme.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 50,
    ...theme.shadow,
  },
  organizationButtonHover: {
    backgroundColor: theme.secondaryColor,
  },
  organizationButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 