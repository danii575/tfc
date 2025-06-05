import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log del error para debugging
    console.error('[ErrorBoundary] Error capturado:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          type="javascript"
        />
      );
    }

    return this.props.children;
  }
}

// Componente de pantalla de error reutilizable
const ErrorScreen = ({ error, onRetry, type = 'general' }) => {
  const router = useRouter();

  const getErrorInfo = () => {
    switch (type) {
      case 'javascript':
        return {
          title: 'Error Inesperado',
          message: 'Ha ocurrido un error inesperado en la aplicación.',
          icon: 'bug-report'
        };
      case '404':
        return {
          title: 'Página No Encontrada',
          message: 'La página que buscas no existe o ha sido movida.',
          icon: 'search-off'
        };
      case '500':
        return {
          title: 'Error del Servidor',
          message: 'El servidor no está disponible. Inténtalo más tarde.',
          icon: 'server-network-off'
        };
      case 'network':
        return {
          title: 'Error de Conexión',
          message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
          icon: 'wifi-off'
        };
      default:
        return {
          title: 'Error',
          message: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
          icon: 'error'
        };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <MaterialIcons 
          name={errorInfo.icon} 
          size={80} 
          color="#E76F51" 
          style={styles.icon}
        />
        
        <Text style={styles.title}>{errorInfo.title}</Text>
        <Text style={styles.message}>{errorInfo.message}</Text>
        
        {error && __DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Información técnica:</Text>
            <Text style={styles.debugText}>{error.toString()}</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={onRetry}
          >
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.replace('/')}
          >
            <MaterialIcons name="home" size={20} color="#2A9D8F" />
            <Text style={styles.secondaryButtonText}>Ir al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#264653',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2A9D8F',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2A9D8F',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
export { ErrorScreen }; 