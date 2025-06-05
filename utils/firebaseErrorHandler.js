import { Alert } from 'react-native';
import { ErrorHandler, ERROR_TYPES } from './errorHandler';

// Mapeo específico de códigos de error de Firebase a mensajes en español
const FIREBASE_ERROR_MESSAGES = {
  // Errores de Authentication
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Las credenciales proporcionadas son inválidas.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Inténtalo más tarde.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/operation-not-allowed': 'Esta operación no está permitida.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
  'auth/internal-error': 'Error interno del servicio de autenticación.',
  
  // Errores de Firestore
  'firestore/permission-denied': 'No tienes permisos para acceder a este recurso.',
  'firestore/not-found': 'El documento solicitado no existe.',
  'firestore/already-exists': 'El documento ya existe.',
  'firestore/resource-exhausted': 'Se ha excedido la cuota del servicio.',
  'firestore/failed-precondition': 'La operación falló debido a condiciones previas.',
  'firestore/unavailable': 'El servicio no está disponible temporalmente.',
  'firestore/data-loss': 'Se ha producido una pérdida de datos.',
  'firestore/unknown': 'Error desconocido en la base de datos.',
  'firestore/invalid-argument': 'Los argumentos proporcionados no son válidos.',
  'firestore/deadline-exceeded': 'La operación tardó demasiado tiempo.',
  'firestore/unauthenticated': 'Debes iniciar sesión para realizar esta acción.',
  
  // Errores de Storage
  'storage/object-not-found': 'El archivo solicitado no existe.',
  'storage/bucket-not-found': 'El almacén especificado no existe.',
  'storage/project-not-found': 'El proyecto no existe.',
  'storage/quota-exceeded': 'Se ha excedido la cuota de almacenamiento.',
  'storage/unauthenticated': 'Debes iniciar sesión para subir archivos.',
  'storage/unauthorized': 'No tienes permisos para esta operación.',
  'storage/retry-limit-exceeded': 'Se excedió el límite de reintentos.',
  'storage/invalid-checksum': 'El archivo está corrupto.',
  'storage/canceled': 'La operación fue cancelada.',
  'storage/invalid-event-name': 'Nombre de evento inválido.',
  'storage/invalid-url': 'URL inválida.',
  'storage/invalid-argument': 'Argumentos inválidos.',
  'storage/no-default-bucket': 'No hay almacén por defecto configurado.',
  'storage/cannot-slice-blob': 'Error al procesar el archivo.',
  'storage/server-file-wrong-size': 'Tamaño de archivo incorrecto.',
  
  // Errores de Functions
  'functions/cancelled': 'La función fue cancelada.',
  'functions/unknown': 'Error desconocido en la función.',
  'functions/invalid-argument': 'Argumentos inválidos para la función.',
  'functions/deadline-exceeded': 'La función tardó demasiado tiempo.',
  'functions/not-found': 'La función no existe.',
  'functions/already-exists': 'La función ya existe.',
  'functions/permission-denied': 'No tienes permisos para ejecutar esta función.',
  'functions/resource-exhausted': 'Se agotaron los recursos disponibles.',
  'functions/failed-precondition': 'Condiciones previas no cumplidas.',
  'functions/aborted': 'La función fue abortada.',
  'functions/out-of-range': 'Valor fuera de rango.',
  'functions/unimplemented': 'Función no implementada.',
  'functions/internal': 'Error interno de la función.',
  'functions/unavailable': 'La función no está disponible.',
  'functions/data-loss': 'Pérdida de datos en la función.',
  'functions/unauthenticated': 'Debes iniciar sesión para usar esta función.',
};

export class FirebaseErrorHandler extends ErrorHandler {
  static getFirebaseErrorMessage(error) {
    if (!error || !error.code) {
      return 'Error de conexión con el servicio.';
    }

    return FIREBASE_ERROR_MESSAGES[error.code] || this.getErrorMessage(error);
  }

  static handleFirebaseError(error, context = '', showAlert = true) {
    this.logError(error, `Firebase - ${context}`);
    
    const message = this.getFirebaseErrorMessage(error);
    const errorType = this.getFirebaseErrorType(error);

    if (showAlert) {
      Alert.alert('Error', message);
    }

    return {
      type: errorType,
      message,
      originalError: error,
      isFirebaseError: true
    };
  }

  static getFirebaseErrorType(error) {
    if (!error || !error.code) {
      return ERROR_TYPES.FIREBASE;
    }

    const code = error.code;

    // Errores de autenticación
    if (code.startsWith('auth/')) {
      if (code.includes('network') || code.includes('timeout')) {
        return ERROR_TYPES.NETWORK;
      }
      return ERROR_TYPES.AUTH;
    }

    // Errores de Firestore
    if (code.startsWith('firestore/')) {
      if (code.includes('not-found')) {
        return ERROR_TYPES.NOT_FOUND;
      }
      if (code.includes('permission-denied') || code.includes('unauthenticated')) {
        return ERROR_TYPES.AUTH;
      }
      if (code.includes('unavailable') || code.includes('internal')) {
        return ERROR_TYPES.SERVER_ERROR;
      }
      return ERROR_TYPES.FIREBASE;
    }

    // Errores de Storage
    if (code.startsWith('storage/')) {
      if (code.includes('object-not-found')) {
        return ERROR_TYPES.NOT_FOUND;
      }
      if (code.includes('unauthenticated') || code.includes('unauthorized')) {
        return ERROR_TYPES.AUTH;
      }
      return ERROR_TYPES.FIREBASE;
    }

    // Errores de Functions
    if (code.startsWith('functions/')) {
      if (code.includes('not-found')) {
        return ERROR_TYPES.NOT_FOUND;
      }
      if (code.includes('unauthenticated') || code.includes('permission-denied')) {
        return ERROR_TYPES.AUTH;
      }
      if (code.includes('unavailable') || code.includes('internal')) {
        return ERROR_TYPES.SERVER_ERROR;
      }
      return ERROR_TYPES.FIREBASE;
    }

    return ERROR_TYPES.FIREBASE;
  }

  // Wrapper específico para operaciones de Firebase Auth
  static async handleAuthOperation(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      throw this.handleFirebaseError(error, `Auth - ${context}`, false);
    }
  }

  // Wrapper específico para operaciones de Firestore
  static async handleFirestoreOperation(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      throw this.handleFirebaseError(error, `Firestore - ${context}`, false);
    }
  }

  // Wrapper específico para operaciones de Storage
  static async handleStorageOperation(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      throw this.handleFirebaseError(error, `Storage - ${context}`, false);
    }
  }
}

// Hook específico para errores de Firebase
export const useFirebaseErrorHandler = () => {
  const handleFirebaseError = (error, context = '', showAlert = true) => {
    return FirebaseErrorHandler.handleFirebaseError(error, context, showAlert);
  };

  const handleAuthOperation = async (operation, context = '') => {
    return FirebaseErrorHandler.handleAuthOperation(operation, context);
  };

  const handleFirestoreOperation = async (operation, context = '') => {
    return FirebaseErrorHandler.handleFirestoreOperation(operation, context);
  };

  const handleStorageOperation = async (operation, context = '') => {
    return FirebaseErrorHandler.handleStorageOperation(operation, context);
  };

  return {
    handleFirebaseError,
    handleAuthOperation,
    handleFirestoreOperation,
    handleStorageOperation
  };
}; 