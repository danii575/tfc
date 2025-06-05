# Sistema de Manejo de Errores

## Descripción General

Se ha implementado un sistema robusto de manejo de errores que captura y procesa diferentes tipos de errores de manera consistente y amigable para el usuario.

## Componentes del Sistema

### 1. ErrorBoundary (`components/ErrorBoundary.js`)
- Captura errores de JavaScript no manejados
- Proporciona una interfaz de error consistente
- Permite recuperación del error sin reiniciar la aplicación

### 2. ErrorHandler (`utils/errorHandler.js`)
- Manejo centralizado de errores
- Clasificación automática de tipos de error
- Logging estructurado para debugging
- Interceptor de fetch requests

### 3. FirebaseErrorHandler (`utils/firebaseErrorHandler.js`)
- Manejo específico para errores de Firebase
- Traducción de códigos de error a mensajes en español
- Soporte para Auth, Firestore, Storage y Functions

### 4. Páginas de Error
- `app/+not-found.js`: Página 404
- `app/error.js`: Página genérica de errores

## Tipos de Errores Soportados

### Errores HTTP
- **404**: Página no encontrada
- **500**: Error del servidor
- **4xx**: Errores del cliente
- **5xx**: Errores del servidor

### Errores de Red
- Fallos de conexión
- Timeouts
- Errores de fetch

### Errores de Firebase
- **Authentication**: Login, registro, verificación
- **Firestore**: Permisos, documentos no encontrados
- **Storage**: Archivos, cuotas
- **Functions**: Ejecución, permisos

### Errores de JavaScript
- Errores de runtime
- Referencias nulas
- Errores de sintaxis

## Cómo Usar el Sistema

### Uso Básico
```javascript
import { useErrorHandler } from '../utils/errorHandler';

const { handleError, handleAsyncError } = useErrorHandler();

// Manejar error simple
try {
  // código que puede fallar
} catch (error) {
  handleError(error, 'Contexto del error');
}

// Manejar operación async
const result = await handleAsyncError(
  () => fetch('/api/data'),
  'Cargando datos'
);
```

### Uso con Firebase
```javascript
import { useFirebaseErrorHandler } from '../utils/firebaseErrorHandler';

const { handleFirebaseError, handleAuthOperation } = useFirebaseErrorHandler();

// Manejar operación de auth
try {
  await handleAuthOperation(
    () => signInWithEmailAndPassword(auth, email, password),
    'Inicio de sesión'
  );
} catch (error) {
  // Error ya manejado automáticamente
}
```

## Configuración de Navegación

### Redirigir a Páginas de Error
```javascript
// Error 404
router.push('/error?type=404');

// Error 500
router.push('/error?type=500');

// Error de red
router.push('/error?type=network');
```

## Funcionalidades Incluidas

### 1. Logging Automático
- Todos los errores se registran en console con timestamp
- Información de contexto para debugging
- Preparado para servicios de monitoreo (Sentry, etc.)

### 2. Mensajes Localizados
- Mensajes de error en español
- Descripciones técnicas para desarrollo
- Mensajes amigables para usuarios

### 3. Recuperación de Errores
- Botones de "Intentar de nuevo"
- Navegación de vuelta al home
- Recarga de página cuando es apropiado

### 4. Interceptores
- Fetch interceptor automático
- Manejo de códigos de estado HTTP
- Información adicional en errores

## Cómo Probar el Sistema

### Desde el Navegador

1. **Iniciar la aplicación**:
   ```bash
   npm start
   # o
   npx expo start --web
   ```

2. **Navegar a la página de pruebas**:
   ```
   http://localhost:19006/test-errors
   ```

3. **Probar diferentes tipos de errores**:
   - Error 404: Navega a URL inexistente
   - Error 500: Simula error del servidor
   - Error de red: Prueba conexión fallida
   - Error Firebase: Simula errores de autenticación
   - Error JavaScript: Activa ErrorBoundary

### URLs de Prueba Específicas

- **404**: `http://localhost:19006/pagina-inexistente`
- **Error genérico**: `http://localhost:19006/error?type=500`
- **Error de red**: `http://localhost:19006/error?type=network`

## Personalización

### Agregar Nuevos Tipos de Error
```javascript
// En errorHandler.js
export const ERROR_TYPES = {
  // ... existentes
  CUSTOM_ERROR: 'custom',
};

// Agregar mensaje personalizado
const messages = {
  // ... existentes
  [ERROR_TYPES.CUSTOM_ERROR]: 'Mensaje personalizado',
};
```

### Modificar Estilos de Error
```javascript
// En ErrorBoundary.js - styles object
const styles = StyleSheet.create({
  // Personalizar estilos aquí
});
```

## Integración con Servicios de Monitoreo

### Preparado para Sentry
```javascript
// En errorHandler.js - logError method
if (!__DEV__) {
  Sentry.captureException(error, {
    tags: { context },
    extra: { timestamp: new Date().toISOString() }
  });
}
```

### Preparado para Crashlytics
```javascript
// En errorHandler.js - logError method
if (!__DEV__) {
  crashlytics().recordError(error);
}
```

## Ventajas del Sistema

1. **Consistencia**: Manejo uniforme en toda la aplicación
2. **Usabilidad**: Mensajes claros y opciones de recuperación
3. **Debugging**: Logging detallado para desarrollo
4. **Localización**: Mensajes en español
5. **Escalabilidad**: Fácil agregar nuevos tipos de error
6. **Mantenimiento**: Código centralizado y reutilizable

## Consideraciones de Rendimiento

- Interceptores mínimos sin impacto significativo
- Lazy loading de componentes de error
- Manejo eficiente de memoria
- Logging controlado por entorno

## Compatibilidad

- ✅ React Native
- ✅ Expo Web
- ✅ iOS
- ✅ Android
- ✅ Web browsers

## Próximas Mejoras

- [ ] Integración con servicios de monitoreo
- [ ] Métricas de errores
- [ ] Reportes automáticos
- [ ] Cache de errores offline
- [ ] Retry automático con backoff 