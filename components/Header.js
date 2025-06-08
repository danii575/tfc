// components/Header.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Alert, Dimensions } from 'react-native';
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  // Cambiamos el breakpoint a 1024px para mejor responsividad
  const isMobile = Platform.OS !== 'web' || screenWidth < 1024;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setDrawerOpen(false));
  };

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
    <View style={[styles.headerContainer, isMobile && styles.headerContainerMobile]}>
      {/* Sección Izquierda (logo) */}
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => handleNav(null, '/', onNavigateToHome)} activeOpacity={0.7}>
            <Text style={styles.logo}>🐾 PetCareSeguros</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sección Central (enlaces de navegación) */}
      {showNavLinks && !isMobile && (
        <View style={styles.centerSection}>
          <HeaderHoverable onPress={() => handleNav(null, '/#plans', onNavigateToPlans)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Planes</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => handleNav(null, '/#steps', onNavigateToServices)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Servicios</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => handleNav(null, '/#about', onNavigateToAbout)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Sobre Nosotros</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => handleNav(null, '/#contact', onNavigateToContact)} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Contacto</Text></HeaderHoverable>
          <HeaderHoverable onPress={() => router.push('/organizaciones')} style={styles.navItemContainer} hoverStyle={styles.navItemHover}><Text style={styles.navItemText}>Organizaciones</Text></HeaderHoverable>
          {userData?.role === 'admin' && (
            <HeaderHoverable onPress={() => router.push('/admin')} style={styles.navItemContainer} hoverStyle={styles.navItemHover}>
              <Text style={styles.navItemText}>Panel de Administración</Text>
            </HeaderHoverable>
          )}
        </View>
      )}
      {!showNavLinks && <View style={styles.centerSectionPlaceholder} /> /* Espaciador si no hay links */}

      {/* Sección Derecha (Controles de Autenticación o menú hamburguesa en móvil) */}
      <View style={styles.rightSection}>
        {isMobile ? (
          <TouchableOpacity onPress={openDrawer} style={{ marginLeft: 12 }}>
            <MaterialIcons name="menu" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          currentUser ? (
            <>
              <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginRight: 12}} onPress={() => router.push('/PerfilUsuario')}>
                <MaterialIcons name="account-circle" size={28} color={COLORS.primary} style={{marginRight: 6}} />
                <Text style={styles.userNameText} numberOfLines={1}>
                  {userData?.nombreCompleto || userData?.nombre || currentUser.displayName || currentUser.email?.split('@')[0]}
                </Text>
              </TouchableOpacity>
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
          )
        )}
      </View>

      {/* Drawer para móvil */}
      {isMobile && drawerOpen && (
        <>
          {/* Fondo semitransparente */}
          <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={closeDrawer} />
          <Animated.View style={[styles.drawer, {
            left: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-260, 0] }),
            shadowOpacity: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }),
          }]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.logo}>🐾 PetCareSeguros</Text>
              <TouchableOpacity onPress={closeDrawer} style={{ marginLeft: 8 }}>
                <MaterialIcons name="close" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.drawerLinks}>
              <TouchableOpacity onPress={() => { closeDrawer(); handleNav(null, '/#plans', onNavigateToPlans); }} style={styles.drawerLink}><Text style={styles.navItemText}>Planes</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { closeDrawer(); handleNav(null, '/#steps', onNavigateToServices); }} style={styles.drawerLink}><Text style={styles.navItemText}>Servicios</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { closeDrawer(); handleNav(null, '/#about', onNavigateToAbout); }} style={styles.drawerLink}><Text style={styles.navItemText}>Sobre Nosotros</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { closeDrawer(); handleNav(null, '/#contact', onNavigateToContact); }} style={styles.drawerLink}><Text style={styles.navItemText}>Contacto</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { closeDrawer(); router.push('/organizaciones'); }} style={styles.drawerLink}><Text style={styles.navItemText}>Organizaciones</Text></TouchableOpacity>
              {isMobile && userData?.role === 'admin' && (
                <TouchableOpacity onPress={() => { closeDrawer(); router.push('/admin'); }} style={styles.drawerLink}>
                  <Text style={styles.navItemText}>Panel de Administración</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.drawerAuth}>
              {currentUser ? (
                <>
                  <TouchableOpacity onPress={() => { closeDrawer(); router.push('/PerfilUsuario'); }} style={styles.drawerAuthButton}>
                    <MaterialIcons name="person" size={20} color={COLORS.primary} style={{marginRight: 8}} />
                    <Text style={styles.authButtonText}>Perfil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { closeDrawer(); handleLogout(); }} style={styles.drawerAuthButton}>
                    <MaterialIcons name="logout" size={18} color={COLORS.primary} style={{marginRight: spacing.small / 2}} />
                    <Text style={styles.authButtonText}>Salir</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => { closeDrawer(); router.push('/login'); }} style={styles.drawerAuthButton}>
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { closeDrawer(); router.push('/registro'); }} style={[styles.drawerAuthButton, styles.signupButton, { marginTop: 8 }]}> 
                    <Text style={styles.signupButtonText}>Registrarse</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </>
      )}
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
    paddingHorizontal: Platform.OS === 'web' ? 40 : 12, // Reducido en móvil
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...(Platform.OS === 'web' && { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }),
    zIndex: 1000, // Aseguramos zIndex alto
  },
  headerContainerMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 100,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 260,
    height: '100%',
    backgroundColor: COLORS.white,
    zIndex: 101,
    paddingTop: 24,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowRadius: 12,
    elevation: 8,
    display: 'flex',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  drawerLinks: {
    marginBottom: 32,
  },
  drawerLink: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  drawerAuth: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    paddingTop: 18,
  },
  drawerAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuButton: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 4,
    marginHorizontal: spacing.small / 4,
  },
  menuButtonText: {
    fontSize: Platform.OS === 'web' ? 15 : 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  menuItem: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 4,
    marginHorizontal: spacing.small / 4,
  },
  menuItemText: {
    fontSize: Platform.OS === 'web' ? 15 : 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default Header;
