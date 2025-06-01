import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  TouchableOpacity,
  Linking,
  Dimensions,
  Animated,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import Footer from '../components/Footer';

const theme = {
  backgroundLight: '#FAF7F2',
  borderRadius: 18,
  shadow: Platform.select({
    ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 5 },
    android: { elevation: 4 },
    web: { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }
  }),
};

// --- Espaciado y Bordes ---
const spacing = {
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
  ultraLarge: 48,
};

const typography = {
  heading1: {
    fontSize: Platform.OS === "web" ? 38 : 34,
    fontWeight: "bold",
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

const gradients = [
  ['#2A9D8F', '#43E97B'], // verde
  ['#264653', '#6DD5FA'], // azul oscuro
  ['#E76F51', '#FFB88C'], // naranja
  ['#E9C46A', '#FAD961'], // amarillo
  ['#8E54E9', '#4776E6'], // violeta
  ['#36D1C4', '#1E3C72'], // azul claro a azul oscuro para Affiniti
];

const ORGANIZACIONES = [
  {
    id: 'wwf',
    nombre: 'WWF España',
    descripcion: 'Organización líder en la conservación de la naturaleza y el medio ambiente. Trabajan en proyectos de protección animal y educación ambiental en todo el mundo.',
    imagen: require('../assets/images/wwf.png'),
    url: 'https://www.wwf.es/'
  },
  {
    id: 'seo',
    nombre: 'SEO/BirdLife',
    descripcion: 'Sociedad Española de Ornitología, dedicada a la conservación de las aves y sus hábitats. Promueven la investigación y la sensibilización sobre la biodiversidad.',
    imagen: require('../assets/images/seo.png'),
    url: 'https://seo.org/'
  },
  {
    id: 'anaa',
    nombre: 'ANAA',
    descripcion: 'Asociación Nacional Amigos de los Animales, trabajando por el bienestar animal desde 1992. Fomentan la adopción y el respeto hacia los animales domésticos.',
    imagen: require('../assets/images/anaa.jpg'),
    url: 'https://www.anaaweb.org/'
  },
  {
    id: 'apdda',
    nombre: 'APDDA',
    descripcion: 'Asociación Parlamentaria en Defensa de los Derechos de los Animales. Impulsan leyes y políticas públicas para la protección animal.',
    imagen: require('../assets/images/apdda.jpg'),
    url: 'https://apdda.es/'
  },
  {
    id: 'faada',
    nombre: 'FAADA',
    descripcion: 'Fundación para el Asesoramiento y Acción en Defensa de los Animales. Realizan campañas de concienciación y rescate animal.',
    imagen: require('../assets/images/faada.jpg'),
    url: 'https://faada.org/'
  },
  {
    id: 'affiniti',
    nombre: 'Affiniti Foundation',
    descripcion: 'Fundación dedicada a mejorar la vida de los animales a través de la innovación y la tecnología. Colaboran con ONGs y centros de investigación internacionales.',
    imagen: require('../assets/images/affiniti.png'),
    url: 'https://affinitifoundation.org/'
  }
];

const HERO_IMAGE = require('../assets/images/hero2.jpeg');

const FadeInSection = ({ children, delay = 0, duration = 800, style: customStyle, useNativeDriver = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay,
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration,
        delay,
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
          width: '100%',
          alignItems: 'center',
        },
        customStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const OrganizacionCard = ({ organizacion, gradientColors, delay }) => {
  // Animación de aparición
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // Hover states solo en web
  const [isHover, setIsHover] = useState(false);
  const [isBtnHover, setIsBtnHover] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: delay || 0,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: 0,
      duration: 400,
      delay: delay || 0,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, translateY, delay]);

  const handlePress = () => {
    Linking.openURL(organizacion.url);
  };

  // Efectos hover dinámicos
  const cardHoverStyle = Platform.OS === 'web' && isHover ? {
    transform: [{ scale: 1.04 }, { translateY: -10 }],
  } : {};
  const btnHoverStyle = Platform.OS === 'web' && isBtnHover ? {
    borderColor: '#fff',
    color: '#fff',
    filter: 'brightness(1.2) drop-shadow(0 0 8px #fff8)',
    backgroundColor: 'transparent',
    transform: [{ scale: 1.08 }],
  } : {};

  return (
    <Animated.View
      style={[styles.cardWrapper, cardHoverStyle, { opacity: fadeAnim, transform: [{ translateY }, ...(cardHoverStyle.transform || [])] }]}
      onMouseEnter={Platform.OS === 'web' ? () => setIsHover(true) : undefined}
      onMouseLeave={Platform.OS === 'web' ? () => setIsHover(false) : undefined}
    >
      <View style={[
        styles.imageCircleWrapper,
        {
          backgroundColor: 'transparent',
          borderColor: gradientColors[0],
          borderWidth: 6,
          shadowColor: gradientColors[0],
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 2 },
        },
      ]}>
        <Image source={organizacion.imagen} style={styles.imageRedonda} resizeMode="cover" />
      </View>
      <LinearGradient colors={gradientColors} style={styles.cardGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
        <View style={styles.cardContent}>
          <Text style={styles.nombre}>{organizacion.nombre}</Text>
          <Text style={styles.descripcion}>{organizacion.descripcion}</Text>
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            style={[styles.button, btnHoverStyle]}
            onMouseEnter={Platform.OS === 'web' ? () => setIsBtnHover(true) : undefined}
            onMouseLeave={Platform.OS === 'web' ? () => setIsBtnHover(false) : undefined}
          >
            <Text style={styles.buttonText}>Visitar Web</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function OrganizacionesScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  // Grid manual: 3 columnas en web, 1 en móvil
  const getRows = () => {
    const rows = [];
    for (let i = 0; i < ORGANIZACIONES.length; i += isMobile ? 1 : 3) {
      rows.push(ORGANIZACIONES.slice(i, i + (isMobile ? 1 : 3)));
    }
    return rows;
  };

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : Dimensions.get('window').height;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <View style={styles.heroContainer}>
              <ImageBackground source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover">
                <LinearGradient
                  colors={['rgba(42,157,143,0.7)', 'rgba(67,233,123,0.4)', 'rgba(255,255,255,0.0)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.heroOverlay}
                >
                  <FadeInSection delay={200} duration={800} useNativeDriver={Platform.OS !== 'web'}>
                    <>
                      <Text style={styles.heroTitle}>Nuestras Organizaciones Colaboradoras</Text>
                      <Text style={styles.heroSubtitle}>
                        En PetCareSeguros creemos en la importancia de trabajar junto a organizaciones comprometidas con el bienestar animal y la conservación del medio ambiente.
                      </Text>
                    </>
                  </FadeInSection>
                </LinearGradient>
              </ImageBackground>
            </View>
            <View style={styles.content}>
              <View style={styles.grid}>
                {getRows().map((row, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={[
                      styles.row,
                      (Platform.OS !== 'web' || width < 900) && { flexDirection: 'column' }
                    ]}
                  >
                    {row.map((org, idx) => (
                      <OrganizacionCard
                        key={org.id}
                        organizacion={org}
                        gradientColors={gradients[(rowIdx * 3 + idx) % gradients.length]}
                        delay={(rowIdx * 3 + idx) * 100}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>
          <Footer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundLight,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
  content: {
    width: Platform.OS === 'web' ? '100%' : '100vw',
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 0,
    marginLeft: Platform.OS === 'web' ? 'auto' : 0,
    marginRight: Platform.OS === 'web' ? 'auto' : 0,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#264653',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 700,
  },
  grid: {
    width: Platform.OS === 'web' ? '100%' : '100vw',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    display: 'flex',
  },
  cardWrapper: {
    alignItems: 'center',
    marginHorizontal: Platform.OS === 'web' ? 16 : 0,
    marginBottom: 0,
    width: Platform.OS === 'web' ? 460 : '100vw',
    maxWidth: Platform.OS === 'web' ? 460 : '100vw',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    transitionProperty: Platform.OS === 'web' ? 'box-shadow, transform, filter' : undefined,
    transitionDuration: Platform.OS === 'web' ? '0.25s' : undefined,
  },
  imageCircleWrapper: {
    width: Platform.OS === 'web' ? 84 : 60,
    height: Platform.OS === 'web' ? 84 : 60,
    borderRadius: Platform.OS === 'web' ? 42 : 30,
    marginBottom: Platform.OS === 'web' ? -42 : -30,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageRedonda: {
    width: Platform.OS === 'web' ? 78 : 54,
    height: Platform.OS === 'web' ? 78 : 54,
    borderRadius: Platform.OS === 'web' ? 39 : 27,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    width: '100%',
    minHeight: Platform.OS === 'web' ? 280 : undefined,
    borderRadius: theme.borderRadius,
    paddingTop: Platform.OS === 'web' ? 60 : 32,
    paddingBottom: Platform.OS === 'web' ? 24 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && { boxSizing: 'border-box' }),
  },
  cardContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  nombre: {
    fontSize: Platform.OS === 'web' ? 22 : 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.10)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  descripcion: {
    fontSize: Platform.OS === 'web' ? 15 : (Dimensions.get('window').width < 350 ? 12 : 13),
    color: '#fff',
    opacity: 0.93,
    textAlign: 'center',
    marginBottom: 18,
    width: '100%',
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && { wordBreak: 'break-word' }),
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 30,
    backgroundColor: 'transparent', // Botón transparente
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: 'transparent', // Sin sombra de fondo
    transitionProperty: Platform.OS === 'web' ? 'background-color, box-shadow, transform, filter' : undefined,
    transitionDuration: Platform.OS === 'web' ? '0.2s' : undefined,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  heroContainer: {
    width: '100%',
    minHeight: Platform.select({ web: '60vh', default: 300 }),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primaryColor,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.large,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#FFFFFF',
    marginBottom: spacing.large,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: 600,
    textAlign: 'center',
  },
}); 