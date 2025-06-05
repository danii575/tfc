import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ErrorHandler, useErrorHandler } from '../utils/errorHandler';
import { FirebaseErrorHandler, useFirebaseErrorHandler } from '../utils/firebaseErrorHandler';
import Header from '../components/Header';

export default function TestErrorsPage() {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const { handleFirebaseError } = useFirebaseErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState(null);

  const headerProps = {
    title: "Prueba de Errores",
    onNavigateToHome: () => router.replace('/'),
    onNavigateToLogin: () => router.push('/login'),
    onNavigateToSignup: () => router.push('/registro'),
  };

  // Función para simular error 404
  const testNotFoundError = () => {
    // Usar window.location para ir directamente a una URL que no existe
    if (typeof window !== 'undefined') {
      window.location.href = '/pagina-inexistente-test-404';
    } else {
      // Fallback para React Native
      router.push('/pagina-inexistente-test-404');
    }
  };

  // Función para simular error 500
  const testServerError = () => {
    router.push('/error?type=500');
  };

  // Wrapper para manejar el estado de loading de cada test
  const runTest = async (testName, testFunction) => {
    setIsLoading(true);
    setActiveTest(testName);
    try {
      await testFunction();
    } catch (error) {
      // Si el test falla inesperadamente, lo manejamos aquí
      console.error('Error inesperado en test:', error);
    } finally {
      setIsLoading(false);
      setActiveTest(null);
    }
  };

  // Función para simular error de Firebase Auth
  const testFirebaseAuthError = () => {
    setActiveTest('firebase-auth');
    const fakeAuthError = {
      code: 'auth/user-not-found',
      message: 'Firebase auth error simulation'
    };
    handleFirebaseError(fakeAuthError, 'Prueba de error de autenticación');
    setTimeout(() => setActiveTest(null), 1000);
  };

  // Función para simular error de Firestore
  const testFirestoreError = () => {
    setActiveTest('firestore');
    const fakeFirestoreError = {
      code: 'firestore/permission-denied',
      message: 'Firestore permission error simulation'
    };
    handleFirebaseError(fakeFirestoreError, 'Prueba de error de Firestore');
    setTimeout(() => setActiveTest(null), 1000);
  };

  // Función para probar fetch con errores HTTP
  const testHttpStatusError = () => runTest('http-status', async () => {
    // Simular un error HTTP 404
    const fakeHttpError = new Error('HTTP Error: 404 Not Found');
    fakeHttpError.status = 404;
    fakeHttpError.statusText = 'Not Found';
    throw fakeHttpError;
  }).catch(error => handleError(error, 'Prueba de error HTTP 404'));

  // Función para probar un fetch real que falle
  const testRealFetchError = () => runTest('real-fetch', async () => {
    // Intentar hacer fetch a una URL que cause un error real
    await fetch('https://this-domain-does-not-exist-12345.com/api/test');
  }).catch(error => handleError(error, 'Prueba de error de fetch real'));

  const testButtons = [
    {
      id: '404',
      title: 'Error 404 - Página no encontrada',
      description: 'Simula navegación a página inexistente',
      onPress: testNotFoundError,
      icon: 'search',
      color: '#E76F51'
    },
    {
      id: '500',
      title: 'Error 500 - Error del servidor',
      description: 'Simula error interno del servidor',
      onPress: testServerError,
      icon: 'dns',
            color: '#E76F51'
    },
    {
      id: 'http-status',
      title: 'Error HTTP 404',
      description: 'Simula respuesta HTTP 404',
      onPress: testHttpStatusError,
      icon: 'http',
      color: '#FF6B35'
    },
    {
      id: 'real-fetch',
      title: 'Error Fetch Real',
      description: 'Prueba fetch real que puede fallar',
      onPress: testRealFetchError,
      icon: 'cloud-off',
      color: '#FF6B35'
    },
    {
      id: 'firebase-auth',
      title: 'Error Firebase Auth',
      description: 'Simula error de autenticación',
      onPress: testFirebaseAuthError,
      icon: 'account-circle',
      color: '#F18A20'
    },
    {
      id: 'firestore',
      title: 'Error Firestore',
      description: 'Simula error de base de datos',
      onPress: testFirestoreError,
      icon: 'storage',
            color: '#F18A20'
    }
  ];

  return (
    <View style={styles.container}>
      <Header {...headerProps} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Prueba del Sistema de Manejo de Errores</Text>
          <Text style={styles.subtitle}>
            Esta página te permite probar diferentes tipos de errores para verificar que el sistema de manejo funciona correctamente.
          </Text>

          <View style={styles.warningContainer}>
            <MaterialIcons name="warning" size={24} color="#FF9800" />
            <Text style={styles.warningText}>
              Esta página es solo para testing. Los errores mostrados son simulados.
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            {testButtons.map((button, index) => {
              const isActiveTest = activeTest === button.id;
              const isDisabled = isLoading && !isActiveTest;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.testButton, 
                    { borderColor: button.color },
                    isActiveTest && styles.activeTestButton,
                    isDisabled && styles.disabledButton
                  ]}
                  onPress={button.onPress}
                  disabled={isDisabled}
                >
                  <View style={styles.buttonHeader}>
                    {isActiveTest ? (
                      <MaterialIcons 
                        name="hourglass-empty" 
                        size={24} 
                        color={button.color} 
                        style={styles.loadingIcon}
                      />
                    ) : (
                      <MaterialIcons 
                        name={button.icon} 
                        size={24} 
                        color={isDisabled ? '#ccc' : button.color} 
                      />
                    )}
                    <Text style={[
                      styles.buttonTitle, 
                      { color: isDisabled ? '#ccc' : button.color }
                    ]}>
                      {button.title}
                      {isActiveTest && ' (Ejecutando...)'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.buttonDescription,
                    isDisabled && { color: '#ccc' }
                  ]}>
                    {button.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>¿Qué hace cada prueba?</Text>
            <Text style={styles.infoText}>
              • Los errores 404 y 500 te llevan a páginas específicas de error
            </Text>
            <Text style={styles.infoText}>
              • Los errores HTTP muestran alertas con mensajes específicos
            </Text>
            <Text style={styles.infoText}>
              • Los errores de Firebase muestran mensajes traducidos al español
            </Text>
            <Text style={styles.infoText}>
              • El error de fetch real prueba conexiones que pueden fallar
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#264653',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
  },
  buttonsContainer: {
    marginBottom: 24,
  },
  testButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTestButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  loadingIcon: {
    // Animación de rotación se puede agregar aquí si se necesita
  },
  buttonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  infoContainer: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2A9D8F',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#264653',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
    lineHeight: 18,
  },
}); 