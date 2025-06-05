import { Alert } from 'react-native';

// Tipos de errores
export const ERROR_TYPES = {
  NETWORK: 'network',
  SERVER: 'server',
  CLIENT: 'client',
  AUTH: 'auth',
  NOT_FOUND: '404',
  SERVER_ERROR: '500',
  FIREBASE: 'firebase'
};

// Clase para manejar errores de forma centralizada
export class ErrorHandler {
  static logError(error, context = '') {
    const timestamp = new Date().toISOString();
    console.error(`[ErrorHandler] ${timestamp} - ${context}:`, error);
    
    // En producción, aquí podrías enviar el error a un servicio de monitoreo
    if (!__DEV__) {
      // Ejemplo: Sentry, Crashlytics, etc.
      // crashlytics().recordError(error);
    }
  }

  static getErrorType(error) {
    if (!error) return ERROR_TYPES.NETWORK;

    // Error de red/conexión
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch') ||
        error.code === 'NETWORK_ERROR') {
      return ERROR_TYPES.NETWORK;
    }

    // Errores de Firebase
    if (error.code?.startsWith('auth/') || 
        error.code?.startsWith('firestore/') ||
        error.code?.startsWith('storage/')) {
      return ERROR_TYPES.FIREBASE;
    }

    // Errores HTTP por código de estado
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      if (status === 404) return ERROR_TYPES.NOT_FOUND;
      if (status >= 500) return ERROR_TYPES.SERVER_ERROR;
      if (status >= 400) return ERROR_TYPES.CLIENT;
    }

    // Errores de autenticación
    if (error.message?.includes('auth') || error.code?.includes('auth')) {
      return ERROR_TYPES.AUTH;
    }

    return ERROR_TYPES.SERVER;
  }

  static getErrorMessage(error, type = null) {
    const errorType = type || this.getErrorType(error);

    const messages = {
      [ERROR_TYPES.NETWORK]: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
      [ERROR_TYPES.SERVER]: 'El servidor no está disponible. Inténtalo más tarde.',
      [ERROR_TYPES.CLIENT]: 'Hay un problema con tu solicitud. Verifica los datos ingresados.',
      [ERROR_TYPES.AUTH]: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
      [ERROR_TYPES.NOT_FOUND]: 'El recurso solicitado no fue encontrado.',
      [ERROR_TYPES.SERVER_ERROR]: 'Error interno del servidor. Inténtalo más tarde.',
      [ERROR_TYPES.FIREBASE]: 'Error en el servicio. Inténtalo más tarde.'
    };

    return messages[errorType] || 'Ha ocurrido un error inesperado.';
  }

  static handleError(error, context = '', showAlert = true) {
    this.logError(error, context);
    
    const errorType = this.getErrorType(error);
    const message = this.getErrorMessage(error, errorType);

    if (showAlert) {
      Alert.alert('Error', message);
    }

    return {
      type: errorType,
      message,
      originalError: error
    };
  }

  // Wrapper para llamadas async/await con manejo de errores
  static async handleAsyncError(asyncFunction, context = '', showAlert = true) {
    try {
      return await asyncFunction();
    } catch (error) {
      return this.handleError(error, context, showAlert);
    }
  }
}

// Hook personalizado para manejar errores en componentes
export const useErrorHandler = () => {
  const handleError = (error, context = '', showAlert = true) => {
    return ErrorHandler.handleError(error, context, showAlert);
  };

  const handleAsyncError = async (asyncFunction, context = '', showAlert = true) => {
    return ErrorHandler.handleAsyncError(asyncFunction, context, showAlert);
  };

  return { handleError, handleAsyncError };
};

// Interceptor para fetch requests
export const createFetchInterceptor = () => {
  const originalFetch = global.fetch;

  global.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Si la respuesta no es ok, lanzar error
      if (!response.ok) {
        const error = new Error(`HTTP Error: ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }
      
      return response;
    } catch (error) {
      // Agregar información adicional al error
      error.url = args[0];
      error.timestamp = new Date().toISOString();
      throw error;
    }
  };

  // Función para restaurar fetch original
  return () => {
    global.fetch = originalFetch;
  };
};

// Función para inicializar el sistema de manejo de errores
export const initializeErrorHandling = () => {
  // Configurar interceptor de fetch
  const restoreFetch = createFetchInterceptor();

  // Manejar errores no capturados (solo en desarrollo)
  if (__DEV__) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Llamar al console.error original
      originalConsoleError(...args);
      
      // Si es un error de React, no hacer nada adicional aquí
      // El ErrorBoundary se encargará de esos errores
      if (args[0]?.includes && args[0].includes('Warning:')) {
        return;
      }
    };
  }

  return restoreFetch;
}; 