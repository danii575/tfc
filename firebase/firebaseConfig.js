// firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// getAuth se importará en los archivos que lo necesiten directamente.

const firebaseConfig = {
  apiKey: "AIzaSyCh6HnGch0_CCw7CnmkBWPZ8O9GcfesQhI", // ¡Considera usar variables de entorno para esto!
  authDomain: "tfgdam-8cea7.firebaseapp.com",
  projectId: "tfgdam-8cea7",
  storageBucket: "tfgdam-8cea7.appspot.com",
  messagingSenderId: "1050497908540",
  appId: "1:1050497908540:web:bcfbacefdcc097142d6839"
};


let app;
let db;
let storage;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app inicializada por primera vez.");
  } catch (e) {
    console.error("Error al inicializar Firebase App:", e);
    // Manejar el error de inicialización si es necesario
  }
} else {
  app = getApp(); 
  console.log("Firebase app ya estaba inicializada.");
}

if (app) {
  db = getFirestore(app);
  storage = getStorage(app);

  // Configuración de persistencia de Auth para nativo
  // Esto se hace una vez y getAuth(app) en los componentes la respetará.
  if (Platform.OS !== 'web') {
    console.log("Configurando persistencia de Auth para nativo...");
    initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log("Firebase Auth persistencia nativa configurada.");
  } else {
      console.log("Plataforma web detectada, usando persistencia por defecto para Auth (manejada por getAuth).");
  }
} else {
  console.error("La aplicación de Firebase no se pudo inicializar. Los servicios de Firestore y Storage no estarán disponibles.");
  // db y storage serán undefined, lo cual debe manejarse en la app.
}

export const auth = getAuth(app);
export { app, db, storage }; // Exportar la app inicializada y los servicios
