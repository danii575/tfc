// components/Header.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router'; 
import { getAuth, signOut } from 'firebase/auth'; 
import { app as firebaseApp } from '../firebase/firebaseConfig'; 
import { useAuth } from '../app/_layout'; // Asegúrate que la ruta a AuthProvider sea correcta
import { MaterialIcons } from '@expo/vector-icons';

// Definiciones de colores locales para el Header
const COLORS = {
  primary: '#2A9D8F', 
  dark: '#264653',
  white: '#FFFFFF',
  lightGrey: '#F0F0F0',
  darkerPrimary: '#208A8A',
};

// Constantes de tema local para el Header
const themeConstants = {
  secondaryColor: '#264653',
  borderRadius: 12,        
};

const spacing = { small: 8, medium: 12, large: 15, extraLarge: 20 }; 

const HeaderHoverable = ({ onPress, style, children, activeOpacity = 0.7, hoverStyle, isButton = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleMouseEnter = () => { if (Platform.OS === 'web') { setIsHovered(true); if (isButton) { Animated.spring(scaleAnim, { toValue: 1.05, friction: 5, useNativeDriver: Platform.OS !== 'web' }).start(); } } };
  const handleMouseLeave = () => { if (Platform.OS === 'web') { setIsHovered(false); if (isButton) { Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: Platform.OS !== 'web' }).start(); } } };
  const animatedStyle = isButton && Platform.OS === 'web' ? { transform: [{ scale: scaleAnim }] } : {};
  // @ts-ignore
  return ( <TouchableOpacity onPress={onPress} activeOpacity={activeOpacity} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} > <Animated.View style={[style, animatedStyle, isHovered && hoverStyle]}>{children}</Animated.View> </TouchableOpacity> );
};


const Header = (props) => {
  const {
    // title, // Eliminamos la prop 'title' para simplificar el centrado
    onNavigateToHome, onNavigateToPlans, onNavigateToServices, 
    onNavigateToAbout, onNavigateToContact,
  } = props;

  const router = useRouter();
  const pathname = usePathname(); 
  const { currentUser, userData } = useAuth(); 

  const handleLogout = async () => {
    console.log("[Header] Cerrando sesión...");
    const authInstance = getAuth(firebaseApp);
    try {
      await signOut(authInstance);
      console.log("[Header] Sesión cerrada exitosamente.");
      // Ya no redirigimos a /login. El AuthProvider actualizará el estado,
      // y el Header se re-renderizará mostrando los botones de login/registro.
      // Si estás en una página protegida, Expo Router debería manejar la redirección
      // si tienes configurada la autenticación a nivel de layout.
      // Si quieres forzar ir al index:
      if (pathname !== '/') { // Solo navega si no está ya en el index
        router.replace('/'); 
      }
    } catch (error) {
      console.error("[Header] Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    }
  };

  const handleNav = (path, fallbackPath, onNavProp) => {
    if (onNavProp) onNavProp();
    else if (path) router.push(path);
    else if (fallbackPath) router.push(fallbackPath);
  };

  const showNavLinks = pathname !== '/login' && pathname !== '/registro';

  return (
    <View style={styles.headerContainer}>
      {/* Sección Izquierda (puede ser un espaciador o parte del logo si se quiere más a la izquierda) */}
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => handleNav(null, '/', onNavigateToHome)} activeOpacity={0.7}>
            <Text style={styles.logo}>🐾 PetCareSeguros</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sección Central (Enlaces de Navegación - se centrarán si left/right tienen flex similar o si este tiene flex mayor) */}
      {showNavLinks && (
        <View style={styles.centerSection}>
          <HeaderHoverable onPress={() => handleNav(null, '/#plans', onNavigateToPlans)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Planes</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => handleNav(null, '/#steps', onNavigateToServices)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Servicios</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => handleNav(null, '/#about', onNavigateToAbout)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Sobre Nosotros</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => handleNav(null, '/#contact', onNavigateToContact)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Contacto</Text></HeaderHoverable>
        </View>
      )}
      {!showNavLinks && <View style={styles.centerSectionPlaceholder} /> /* Espaciador si no hay links */}


      {/* Sección Derecha (Controles de Autenticación) */}
      <View style={styles.rightSection}>
        {currentUser ? (
          <>
            <Text style={styles.userNameText} numberOfLines={1}>
              Hola, {userData?.nombreCompleto || userData?.nombre || currentUser.displayName || currentUser.email?.split('@')[0]}
            </Text>
            <HeaderHoverable onPress={handleLogout} style={styles.authButton} hoverStyle={styles.loginButtonHover} isButton={true}>
              <MaterialIcons name="logout" size={18} color={COLORS.primary} style={{marginRight: spacing.small / 2}} />
              <Text style={styles.authButtonText}>Salir</Text>
            </HeaderHoverable>
          </>
        ) : (
          <>
            {pathname !== '/login' && (
                <HeaderHoverable onPress={() => router.push('/login')} style={styles.loginButton} hoverStyle={styles.loginButtonHover} isButton={true}>
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </HeaderHoverable>
            )}
            {pathname !== '/registro' && (
                <HeaderHoverable onPress={() => router.push('/registro')} style={styles.signupButton} hoverStyle={styles.signupButtonHover} isButton={true}>
                <Text style={styles.signupButtonText}>Registrarse</Text>
                </HeaderHoverable>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Mantiene los elementos principales espaciados
    paddingVertical: 15,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...(Platform.OS === 'web' && { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }),
    zIndex: 10, 
  },
  leftSection: {
    // Podría tener un flex si el centerSection también lo tiene para balancear
    // Por ahora, dejamos que el contenido defina su tamaño.
  },
  logo: {
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: 'bold',
    color: COLORS.primary, 
  },
  centerSection: { // Contenedor para los enlaces de navegación, para centrarlos
    flex: 1, // Ocupa el espacio disponible en el centro
    flexDirection: 'row',
    justifyContent: 'center', // Centra los navLinks horizontalmente
    alignItems: 'center',
    display: Platform.OS === 'web' ? 'flex' : 'none', // Ocultar en móvil por defecto
  },
  centerSectionPlaceholder: { // Para mantener el balance cuando los links no están
    flex: 1,
  },
  navLinks: { // Este ya no es necesario si centerSection maneja el display
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItemContainer: {
    paddingVertical: spacing.small, 
    paddingHorizontal: Platform.OS === 'web' ? spacing.medium : spacing.small + 2,
    borderRadius: 4,
    marginHorizontal: Platform.OS === 'web' ? spacing.small / 2 : spacing.small / 4, // Espacio entre items
  },
  navItemText: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    color: COLORS.dark, 
    fontWeight: '500',
  },
  navItemHover: {
    backgroundColor: COLORS.lightGrey,
  },
  rightSection: { // Contenedor para los botones de autenticación
    flexDirection: 'row',
    alignItems: 'center',
    // No necesita flex:1 si headerContainer usa space-between y left/center toman su espacio
  },
  authControls: { // Este estilo ya no es necesario si rightSection lo maneja
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: Platform.OS === 'web' ? 15 : 14,
    color: themeConstants.secondaryColor, 
    marginRight: spacing.medium,
    fontWeight: '500',
    maxWidth: 150, // Para evitar que nombres largos empujen todo
  },
  authButton: { 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1.5, 
    borderColor: COLORS.primary,
    borderRadius: themeConstants.borderRadius / 1.5, 
    paddingVertical: Platform.OS === 'web' ? spacing.small : spacing.small -1,
    paddingHorizontal: Platform.OS === 'web' ? spacing.medium : spacing.small + 2,
  },
  loginButton: { 
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: themeConstants.borderRadius / 1.5, 
    paddingVertical: Platform.OS === 'web' ? spacing.small : spacing.small -1,
    paddingHorizontal: Platform.OS === 'web' ? spacing.medium : spacing.small + 2,
    marginRight: spacing.medium,
  },
  loginButtonHover: {
    backgroundColor: 'rgba(43, 187, 173, 0.1)',
  },
  authButtonText: { 
    color: COLORS.primary,
    fontSize: Platform.OS === 'web' ? 15 : 14,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: themeConstants.borderRadius / 1.5, 
    paddingVertical: Platform.OS === 'web' ? spacing.small + 1.5 : spacing.small, 
    paddingHorizontal: Platform.OS === 'web' ? spacing.medium : spacing.small + 2,
  },
  signupButtonHover: {
    backgroundColor: COLORS.darkerPrimary,
  },
  signupButtonText: {
    color: COLORS.white,
    fontSize: Platform.OS === 'web' ? 15 : 14,
    fontWeight: 'bold',
  },
});

export default Header;
