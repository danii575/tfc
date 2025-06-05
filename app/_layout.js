// app/_layout.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { View, ActivityIndicator } from 'react-native'; // Para el spinner de carga
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app as firebaseApp, db } from '../firebase/firebaseConfig'; // Importar app y db
import { doc, getDoc } from 'firebase/firestore';
import ErrorBoundary from '../components/ErrorBoundary';
import { initializeErrorHandling } from '../utils/errorHandler';

// 1. Crear el Contexto de Autenticación
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// 2. Crear el Proveedor de Autenticación
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Usuario de Firebase Auth
  const [userData, setUserData] = useState(null); // Datos adicionales de Firestore (nombre, apellidos, etc.)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Para saber si la comprobación inicial de auth ha terminado

  // Función para refrescar los datos del usuario
  const refreshUserData = async (user) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const firestoreUserData = userDocSnap.data();
        console.log("[AuthProvider] Datos actualizados de Firestore:", firestoreUserData);
        setUserData(firestoreUserData);
      }
    } catch (error) {
      console.error("[AuthProvider] Error al refrescar datos del usuario:", error);
    }
  };

  useEffect(() => {
    console.log("[AuthProvider] Montado. Suscribiéndose a onAuthStateChanged...");
    const authInstance = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      console.log("[AuthProvider] Estado de Auth CAMBIÓ. Usuario:", user ? user.uid : null);
      setCurrentUser(user);
      if (user) {
        // Si hay usuario, intentar cargar sus datos de Firestore
        try {
          console.log("[AuthProvider] Cargando datos para usuario:", user.uid);
          console.log("[AuthProvider] DisplayName actual:", user.displayName);
          
          const userDocRef = doc(db, "usuarios", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const firestoreUserData = userDocSnap.data();
            console.log("[AuthProvider] Datos de Firestore del usuario:", firestoreUserData);
            setUserData(firestoreUserData);
          } else {
            console.warn("[AuthProvider] No se encontró documento de perfil en Firestore para UID:", user.uid);
            // Usar displayName de Auth como fallback si no hay perfil en Firestore (aunque registro.js lo crea)
            setUserData({ nombreCompleto: user.displayName || user.email }); 
          }
        } catch (error) {
            console.error("[AuthProvider] Error al obtener datos de Firestore del usuario:", error);
            setUserData({ nombreCompleto: user.displayName || user.email }); // Fallback en caso de error
        }
      } else {
        console.log("[AuthProvider] No hay usuario autenticado");
        setUserData(null); // No hay usuario, no hay datos de Firestore
      }
      setIsLoadingAuth(false);
      console.log("[AuthProvider] isLoadingAuth puesto a false.");
    });

    return () => {
      console.log("[AuthProvider] Desmontado. Desuscribiéndose de onAuthStateChanged.");
      unsubscribe();
    };
  }, []);

  // Muestra un spinner mientras se verifica el estado de autenticación
  // Esto evita que se muestre brevemente la pantalla de login/registro si el usuario ya está logueado.
  if (isLoadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F2' }}>
        <ActivityIndicator size="large" color="#2A9D8F" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userData, isLoadingAuth, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Envolver tu Stack principal con AuthProvider
export default function RootLayout() {
  // Inicializar el sistema de manejo de errores
  useEffect(() => {
    const restoreFetch = initializeErrorHandling();
    
    // Cleanup al desmontar el componente
    return () => {
      if (restoreFetch) {
        restoreFetch();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Tus pantallas se definen automáticamente por los archivos en 'app' */}
          {/* Ejemplo de cómo podrías definir una pantalla específica si es necesario: */}
          {/* <Stack.Screen name="index" /> */}
          {/* <Stack.Screen name="login" /> */}
          {/* <Stack.Screen name="registro" /> */}
          {/* <Stack.Screen name="presupuesto" /> */}
          {/* <Stack.Screen name="presupuestoFinal" /> */}
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
